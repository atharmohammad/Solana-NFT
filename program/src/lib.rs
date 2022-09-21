use solana_program::{
    entrypoint,
    account_info::{next_account_info,AccountInfo},
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
    program::invoke,
    system_instruction,
    native_token::LAMPORTS_PER_SOL,
};
use spl_token::instruction::*;
use spl_associated_token_account::instruction::*;


entrypoint!(process_instructions);

fn process_instructions(
    _program_id:&Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    msg!("Program Pinged  !");
    let account_iter = &mut accounts.iter();
    let mint = next_account_info(account_iter)?;
    let token_account= next_account_info(account_iter)?;
    let mint_authority = next_account_info(account_iter)?;
    let rent = next_account_info(account_iter)?;
    let token_program = next_account_info(account_iter)?;
    let associated_token_program = next_account_info(account_iter)?;
    let _system_program = next_account_info(account_iter)?;

    msg!("Creating mint account !");
    invoke(&system_instruction::create_account(&mint_authority.key, &mint.key, LAMPORTS_PER_SOL , 82, &token_account.key), 
        &[
            token_account.clone(),
            mint.clone(),
            mint_authority.clone(),
        ]
    )?;
    msg!("initializing mint !");
    invoke(
        &initialize_mint(&token_program.key, &mint.key, &mint_authority.key, Some(&mint_authority.key) , 0)?, 
        &[
            token_program.clone(),
            mint.clone(),
            mint_authority.clone(),
            rent.clone()
        ],
    )?; // decimals 0 for nft
    
    msg!("creating token account !");
    invoke(&create_associated_token_account(token_account.key, mint_authority.key, mint.key, associated_token_program.key), 
    &[
        token_account.clone(),
        mint_authority.clone(),
        mint.clone(),
        token_program.clone(),
        associated_token_program.clone()
    ])?;
    msg!("mint to token account");
    invoke(
        &mint_to(token_program.key, mint.key, token_account.key, mint_authority.key, &[&mint_authority.key],1)?,
        &[
            token_program.clone(),
            mint.clone(),
            token_account.clone(),
            mint_authority.clone(),
            rent.clone()
        ]
    )?;
    msg!("NFT is minted !");

    Ok(())
}