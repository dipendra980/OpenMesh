use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Token, TokenAccount, Transfer};

declare_id!("4CN3kzEDw8FuSoA4q2nonbFhjXDaaaz96YkcuDZLeLaz");

#[program]
pub mod openmesh_escrow {
    use super::*;

    /// Initialize a deterministic escrow PDA for an autonomous agent job
    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        job_id: [u8; 16],
        amount: u64,
        timeout_slots: u64,
    ) -> Result<()> {
        let clock = Clock::get()?;
        let escrow = &mut ctx.accounts.job_escrow;

        escrow.agent = ctx.accounts.agent.key();
        escrow.provider = ctx.accounts.provider.key();
        escrow.amount = amount;
        escrow.job_id = job_id;
        escrow.timeout_slot = clock.slot + timeout_slots;
        escrow.bump = ctx.bumps.job_escrow;
        escrow.status = EscrowStatus::Locked;

        // Transfer USDC from Agent token account to the Escrow PDA Vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.agent_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.agent.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        emit!(EscrowLockedEvent {
            job_id,
            agent: escrow.agent,
            provider: escrow.provider,
            amount,
            timeout_slot: escrow.timeout_slot,
        });

        Ok(())
    }

    /// Releases escrowed funds to provider upon verified inference delivery
    pub fn settle_payment(
        ctx: Context<SettlePayment>,
        job_id: [u8; 16],
        output_hash: [u8; 32],
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.job_escrow;
        require!(escrow.status == EscrowStatus::Locked, EscrowError::InvalidState);

        // Sign with PDA seeds
        let agent_key = escrow.agent;
        let seeds = &[
            b"mesh_escrow",
            agent_key.as_ref(),
            &escrow.job_id[..],
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];

        // Transfer USDC from PDA Vault to Provider
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.provider_token_account.to_account_info(),
            authority: ctx.accounts.job_escrow.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, escrow.amount)?;

        escrow.status = EscrowStatus::Settled;

        emit!(PaymentSettledEvent {
            job_id,
            provider: escrow.provider,
            amount: escrow.amount,
            output_hash,
        });

        Ok(())
    }

    /// Refund 100% of USDC back to Agent if provider times out or fails verification
    pub fn claim_refund(ctx: Context<ClaimRefund>, job_id: [u8; 16]) -> Result<()> {
        let clock = Clock::get()?;
        let escrow = &mut ctx.accounts.job_escrow;
        
        require!(escrow.status == EscrowStatus::Locked, EscrowError::InvalidState);
        // Eligible if timeout expired OR if agent triggers programmatic challenge failure
        let is_timed_out = clock.slot >= escrow.timeout_slot;
        require!(
            is_timed_out || ctx.accounts.agent.key() == escrow.agent,
            EscrowError::TimeoutNotReached
        );

        let agent_key = escrow.agent;
        let seeds = &[
            b"mesh_escrow",
            agent_key.as_ref(),
            &escrow.job_id[..],
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];

        // Transfer USDC back to Agent token account
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.agent_token_account.to_account_info(),
            authority: ctx.accounts.job_escrow.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        );
        token::transfer(cpi_ctx, escrow.amount)?;

        escrow.status = EscrowStatus::Refunded;

        emit!(EscrowRefundedEvent {
            job_id,
            agent: escrow.agent,
            amount: escrow.amount,
        });

        Ok(())
    }
}

// ------------------------------------------------------------------------
// Account Structs
// ------------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(job_id: [u8; 16], amount: u64)]
pub struct InitializeEscrow<'info> {
    #[account(mut)]
    pub agent: Signer<'info>,

    /// CHECK: Target provider address
    pub provider: AccountInfo<'info>,

    #[account(
        init,
        payer = agent,
        space = 8 + JobEscrow::INIT_SPACE,
        seeds = [b"mesh_escrow", agent.key().as_ref(), &job_id],
        bump
    )]
    pub job_escrow: Account<'info, JobEscrow>,

    #[account(
        mut,
        token::authority = agent,
    )]
    pub agent_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = agent,
        token::mint = agent_token_account.mint,
        token::authority = job_escrow,
        seeds = [b"vault", job_escrow.key().as_ref()],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(job_id: [u8; 16])]
pub struct SettlePayment<'info> {
    pub agent: Signer<'info>,

    /// CHECK: Verified provider receiving funds
    #[account(mut)]
    pub provider: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"mesh_escrow", agent.key().as_ref(), &job_id],
        bump = job_escrow.bump,
        has_one = agent,
        has_one = provider,
    )]
    pub job_escrow: Account<'info, JobEscrow>,

    #[account(
        mut,
        seeds = [b"vault", job_escrow.key().as_ref()],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub provider_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(job_id: [u8; 16])]
pub struct ClaimRefund<'info> {
    #[account(mut)]
    pub agent: Signer<'info>,

    #[account(
        mut,
        seeds = [b"mesh_escrow", agent.key().as_ref(), &job_id],
        bump = job_escrow.bump,
        has_one = agent,
    )]
    pub job_escrow: Account<'info, JobEscrow>,

    #[account(
        mut,
        seeds = [b"vault", job_escrow.key().as_ref()],
        bump
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub agent_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ------------------------------------------------------------------------
// State & Events
// ------------------------------------------------------------------------

#[account]
#[derive(InitSpace)]
pub struct JobEscrow {
    pub agent: Pubkey,
    pub provider: Pubkey,
    pub amount: u64,
    pub job_id: [u8; 16],
    pub timeout_slot: u64,
    pub bump: u8,
    pub status: EscrowStatus,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum EscrowStatus {
    Locked,
    Settled,
    Refunded,
    Disputed,
}

#[error_code]
pub enum EscrowError {
    #[msg("Escrow is not in the required locked state")]
    InvalidState,
    #[msg("Timeout slot has not yet been reached for non-agent caller")]
    TimeoutNotReached,
}

#[event]
pub struct EscrowLockedEvent {
    pub job_id: [u8; 16],
    pub agent: Pubkey,
    pub provider: Pubkey,
    pub amount: u64,
    pub timeout_slot: u64,
}

#[event]
pub struct PaymentSettledEvent {
    pub job_id: [u8; 16],
    pub provider: Pubkey,
    pub amount: u64,
    pub output_hash: [u8; 32],
}

#[event]
pub struct EscrowRefundedEvent {
    pub job_id: [u8; 16],
    pub agent: Pubkey,
    pub amount: u64,
}
