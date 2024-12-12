import React, { useState } from 'react';
import { Connection, PublicKey, Transaction, SystemProgram, Commitment } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import * as anchor from '@project-serum/anchor';
// import idlData from "../../target/idl/staking_contract.json"
import idlData from "./idl.json"
import { Idl } from '@project-serum/anchor';

const Staking: React.FC = () => {
  const { publicKey, sendTransaction } = useWallet();
  const [poolName, setPoolName] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [apr, setApr] = useState<number>(0);
  const [lockTime, setLockTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const network = 'https://api.devnet.solana.com';
  const idl = idlData as unknown as Idl;
  const programID = new PublicKey(idlData.address);
  const programId = new PublicKey('4o1q6vaE6iteojmFnYQkve1jDA3UTGxLar1Puh58FqGi');
  const stakingContract = new anchor.web3.PublicKey("93sKJHo6aBG5efDhtirSK5Es2jyuJPvKBAj1rKNU6z4o"); // Replace with your actual contract address
const opts: { preflightCommitment: Commitment } = { preflightCommitment: "processed" };
const wallet = useWallet();
//   const provider = new anchor.AnchorProvider(connection, publicKey!, { commitment: 'processed' });
  const getProvider = (wallet: any) => {
  const connection = new Connection(network, opts.preflightCommitment);
  return new anchor.AnchorProvider(connection, wallet, opts);
};
  const program = new anchor.Program(idl, programID, getProvider(wallet)); // `idl` would be the IDL of your program
    const connection = new Connection(network);

  const createPool = async () => {
    const provider = getProvider(wallet);
    try {
      setIsLoading(true);
      const transaction = new Transaction();
      
      // Call the create staking contract function
      await program.rpc.createStakingContract(poolName, {
        accounts: {
          masterContract: provider.wallet.publicKey, // Replace with actual Master contract address
          stakingContract: stakingContract, // Replace with actual staking contract address
          owner: publicKey!,
        },
      });

      await sendTransaction(transaction, connection);
      setIsLoading(false);
      alert('Staking pool created successfully!');
    } catch (error) {
      setIsLoading(false);
      console.error(error);
      alert('Error creating staking pool');
    }
  };

  const stakeTokens = async () => {
    try {
      setIsLoading(true);
      const transaction = new Transaction();

      // Call the stake function in the staking contract
      await program.rpc.stake(new anchor.BN(amount), {
        accounts: {
          stakingContract: stakingContract,
          user: publicKey!,
        },
      });

      await sendTransaction(transaction, connection);
      setIsLoading(false);
      alert('Tokens staked successfully!');
    } catch (error) {
      setIsLoading(false);
      console.error(error);
      alert('Error staking tokens');
    }
  };

  const unstakeTokens = async () => {
    try {
      setIsLoading(true);
      const transaction = new Transaction();

      // Call the unstake function
      await program.rpc.unstake(new anchor.BN(amount), {
        accounts: {
          stakingContract: stakingContract,
          user: publicKey!,
        },
      });

      await sendTransaction(transaction, connection);
      setIsLoading(false);
      alert('Tokens unstaked successfully!');
    } catch (error) {
      setIsLoading(false);
      console.error(error);
      alert('Error unstaking tokens');
    }
  };

  return (
    <div>
      <h2>Create Staking Pool</h2>
      <input
        type="text"
        value={poolName}
        onChange={(e) => setPoolName(e.target.value)}
        placeholder="Enter Pool Name"
      />
      <button onClick={createPool} disabled={isLoading}>
        {isLoading ? 'Creating Pool...' : 'Create Pool'}
      </button>

      <h2>Stake Tokens</h2>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(parseInt(e.target.value))}
        placeholder="Amount to Stake"
      />
      <button onClick={stakeTokens} disabled={isLoading}>
        {isLoading ? 'Staking...' : 'Stake Tokens'}
      </button>

      <h2>Unstake Tokens</h2>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(parseInt(e.target.value))}
        placeholder="Amount to Unstake"
      />
      <button onClick={unstakeTokens} disabled={isLoading}>
        {isLoading ? 'Unstaking...' : 'Unstake Tokens'}
      </button>
    </div>
  );
};

export default Staking;
