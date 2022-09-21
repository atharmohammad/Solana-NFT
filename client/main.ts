import {
    LAMPORTS_PER_SOL,
    sendAndConfirmTransaction,
    PublicKey,
    Connection,
    Keypair,
    Transaction,
    TransactionInstruction,
    SYSVAR_RENT_PUBKEY,
    SystemProgram,
} from "@solana/web3.js";
import {TOKEN_PROGRAM_ID,ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress} from "@solana/spl-token";
import fs from 'mz/fs';
import os from 'os';
import path from 'path';
import yaml from 'yaml';


// Path to local Solana CLI config file.
const CONFIG_FILE_PATH = path.resolve(
    os.homedir(),
    '.config',
    'solana',
    'cli',
    'config.yml',
);
const PROGRAM_KEYPAIR_PATH = path.join(
    path.resolve(__dirname,"../dist/program/"),"mint-keypair.json"
);

const createAccount = async(connection:Connection) : Promise<Keypair> => {
    const key = Keypair.generate();
    const airdrop = await connection.requestAirdrop(key.publicKey,2*LAMPORTS_PER_SOL);
    await connection.confirmTransaction(airdrop)
    return key;
}

const createKeypairFromFile = async(path:string): Promise<Keypair> => {
    const secret_keypair = await fs.readFile(path,{encoding:"utf8"});
    const secret_key = Uint8Array.from(JSON.parse(secret_keypair));
    const programKeypair = Keypair.fromSecretKey(secret_key);
    return programKeypair;
}

const main = async()=>{
    const localenet = "http://127.0.0.1:8899";
    const connection = new Connection(localenet);    

    const tx = new Transaction();
    console.log("Pinging ... !");
    // const configYml = await fs.readFile(CONFIG_FILE_PATH, {encoding: 'utf8'});
    // const keypairPath = await yaml.parse(configYml).keypair_path;
    // const wallet = await createKeypairFromFile(keypairPath);
    const programKeypair = await createKeypairFromFile(PROGRAM_KEYPAIR_PATH);
    const mint = Keypair.generate();
    const wallet = await createAccount(connection); //mint_authority is our wallet
    const token_account = await getAssociatedTokenAddress(mint.publicKey,wallet.publicKey);
    const transactionInstruction = new TransactionInstruction({
        keys:[
            {pubkey:mint.publicKey,isSigner:true,isWritable:true},
            {pubkey:token_account,isSigner:false,isWritable:true},
            {pubkey:wallet.publicKey,isSigner:true,isWritable:false},
            {pubkey:SYSVAR_RENT_PUBKEY,isSigner:false,isWritable:false},
            {pubkey:TOKEN_PROGRAM_ID,isSigner:false,isWritable:false},
            {pubkey:ASSOCIATED_TOKEN_PROGRAM_ID,isSigner:false,isWritable:false},
            {pubkey:SystemProgram.programId,isSigner:false,isWritable:false}
        ],
        programId:programKeypair.publicKey,
        data:Buffer.alloc(0)
    })

    await sendAndConfirmTransaction(connection,new Transaction().add(transactionInstruction),[wallet,mint]);
}

main().then(
    ()=>process.exit(),
    err =>{
        console.log(err);
        process.exit(-1);
    }
)