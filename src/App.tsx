import { Buffer } from 'buffer';
window.Buffer = Buffer;

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN } from "@project-serum/anchor";
import {
  PublicKey,
  SystemProgram,
  Keypair,
  Connection,
  Transaction,
  Commitment,
  // LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import idlData from "./idl.json";
import { Idl } from "@project-serum/anchor";

// Constants
const idl = idlData as unknown as Idl;
const network = "https://api.devnet.solana.com";
const programID = new PublicKey(idlData.address);
const opts = {
  preflightCommitment: "processed",
};

const getProvider = (wallet: any) => {
  const connection = new Connection(network, opts.preflightCommitment as Commitment);
  return new AnchorProvider(connection, wallet, { preflightCommitment: "processed" as Commitment });
};

const App = () => {
  const [activeTab, setActiveTab] = useState('stake');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  // const [tokenBalance, _] = useState(0);
  const [masterContract, setMasterContract] = useState<string | null>(null);
  const [stakingContract, setStakingContract] = useState<string | null>(null);
  const [poolName, setPoolName] = useState<string>("");
  const [stakeAmount, setStakeAmount] = useState<number | string>("");
  const [unstakeAmount, setUnstakeAmount] = useState<number | string>("");
  const [stakeDuration, setStakeDuration] = useState<string>("30"); // Default 30 days
  const tokenMint = "3hA3XL7h84N1beFWt3gwSRCDAf5kwZu81Mf1cpUHKzce";

  // const [balance, setBalance] = useState<number>(0);
  // const connection = new Connection(network);
  const wallet = useWallet();
  const { publicKey } = wallet;
  const program = new Program(idl, programID, getProvider(wallet));

  const initializeMasterContract = async () => {
    // Your existing initializeMasterContract code
    setError("");
    setMessage("");

    if (!wallet) {
      setError("Wallet not connected.");
      return;
    }

    const provider = getProvider(wallet);
    try {
      const masterAccountKeypair = Keypair.generate();

      await program.rpc.initializeMaster(provider.wallet.publicKey, {
        accounts: {
          masterContract: masterAccountKeypair.publicKey,
          payer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [masterAccountKeypair],
      });

      setMasterContract(masterAccountKeypair.publicKey.toString());
      setMessage("Master contract initialized successfully.");
    } catch (err) {
      console.error("Error initializing master contract:", err);
      setError("Failed to initialize master contract.");
    }
  };

  // const fetchBalance = async () => {
  //   if (publicKey && connection) {
  //     try {
  //       const walletBalance = await connection.getBalance(
  //         new PublicKey(publicKey)
  //       );
  //       setBalance(walletBalance / LAMPORTS_PER_SOL);
  //     } catch (error) {
  //       console.error("Error fetching balance:", error);
  //     }
  //   }
  // };

  const createStakingContract = async () => {
    setError("");
    setMessage("");

    if (!wallet) {
      setError("Wallet not connected.");
      return;
    }
    if (!poolName) {
      setError("Pool name missing.");
      return;
    }
    if (!masterContract) {
      setError("Master contract not initialized.");
      return;
    }

    const provider = getProvider(wallet);
    try {
      const stakingPoolKeypair = Keypair.generate();
      await program.rpc.createStakingContract(poolName, new PublicKey(tokenMint), {
        accounts: {
          owner: provider.wallet.publicKey,
          masterContract: new PublicKey(masterContract),
          stakingContract: stakingPoolKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [stakingPoolKeypair],
      });

      setStakingContract(stakingPoolKeypair.publicKey.toString());
      setMessage("Staking contract created successfully.");
    } catch (err) {
      console.error("Error creating staking contract:", err);
      setError("Failed to create staking contract.");
    }
  };

  const stake = async () => {
    // Your existing stake code
    setError("");
    setMessage("");

    if (!wallet || !stakeAmount || !stakingContract) {
      setError("Wallet not connected or stake amount missing.");
      return;
    }

    const provider = getProvider(wallet);
    const stakingContractPubkey = new PublicKey(stakingContract);

    let userTokenAccount;
    try {
      userTokenAccount = await getAssociatedTokenAddress(
        new PublicKey(tokenMint),
        provider.wallet.publicKey
      );
    } catch (err) {
      console.error("Error getting user token account:", err);
      setError("Error getting user token account.");
      return;
    }

    // Create user token account if it doesn't exist
    const associatedTokenAccountInfo = await provider.connection.getAccountInfo(userTokenAccount);
    if (!associatedTokenAccountInfo) {
      const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          provider.wallet.publicKey,
          userTokenAccount,
          provider.wallet.publicKey,
          new PublicKey(tokenMint)
        )
      );

      try {
        await provider.sendAndConfirm(transaction);
      } catch (err) {
        console.error("Error creating associated token account:", err);
        setError("Failed to create associated token account.");
        return;
      }
    }

    // Get or create staking token account
    let stakingTokenAccount;
    try {
      stakingTokenAccount = await getAssociatedTokenAddress(
        new PublicKey(tokenMint),
        stakingContractPubkey
      );
    } catch (err) {
      console.error("Error getting staking token account:", err);
      setError("Error getting staking token account.");
      return;
    }

    // Create staking token account if it doesn't exist
    const stakingTokenAccountInfo = await provider.connection.getAccountInfo(stakingTokenAccount);
    if (!stakingTokenAccountInfo) {
      const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          provider.wallet.publicKey,
          stakingTokenAccount,
          stakingContractPubkey,
          new PublicKey(tokenMint)
        )
      );

      try {
        await provider.sendAndConfirm(transaction);
      } catch (err) {
        console.error("Error creating staking token account:", err);
        setError("Failed to create staking token account.");
        return;
      }
    }

    try {
      await program.rpc.stake(new BN(stakeAmount), {
        accounts: {
          stakingContract: stakingContractPubkey,
          user: provider.wallet.publicKey,
          userTokenAccount: userTokenAccount,
          stakingTokenAccount: stakingTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      });
      setMessage("Stake successful.");
    } catch (err) {
      console.error("Error staking:", err);
      setError("Failed to stake.");
    }
  };

  const unstake = async () => {
    // Your existing unstake code
    setError("");
    setMessage("");
    if (!wallet || !unstakeAmount || !stakingContract) {
      setError("Wallet not connected or unstake amount missing.");
      return;
    }

    const provider = getProvider(wallet);
    const stakingContractPubkey = new PublicKey(stakingContract);

    let userTokenAccount;
    try {
      userTokenAccount = await getAssociatedTokenAddress(
        new PublicKey(tokenMint),
        provider.wallet.publicKey
      );
    } catch (err) {
      console.error("Error getting user token account:", err);
      setError("Error getting user token account.");
      return;
    }

    let stakingTokenAccount;
    try {
      stakingTokenAccount = await getAssociatedTokenAddress(
        new PublicKey(tokenMint),
        stakingContractPubkey
      );
    } catch (err) {
      console.error("Error getting staking token account:", err);
      setError("Error getting staking token account.");
      return;
    }

    try {
      await program.rpc.unstake(new BN(unstakeAmount), {
        accounts: {
          stakingContract: stakingContractPubkey,
          user: stakingContractPubkey,
          userTokenAccount: userTokenAccount,
          stakingTokenAccount: stakingTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      });
      setMessage("Unstake successful.");
    } catch (err) {
      console.error("Error unstaking:", err);
      setError("Failed to unstake.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Solana Token Staking</h1>
        <div className="flex justify-center gap-4 mb-6">
          <WalletMultiButton />
          <WalletDisconnectButton />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Setup Contracts</h2>
          <div className="space-y-4">
            <button
              onClick={initializeMasterContract}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
              disabled={Boolean(!publicKey || masterContract)}
            >
              Initialize Master Contract
            </button>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pool Name
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={poolName}
                onChange={(e) => setPoolName(e.target.value)}
                placeholder="Enter pool name"
              />
            </div>
            
            <button
              onClick={() => createStakingContract()}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
              disabled={!publicKey || !masterContract || !poolName}
            >
              Create Staking Contract
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex gap-4 mb-6">
            <button
              className={`flex-1 py-2 px-4 rounded ${
                activeTab === 'stake'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200'
              }`}
              onClick={() => setActiveTab('stake')}
            >
              Stake
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded ${
                activeTab === 'unstake'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200'
              }`}
              onClick={() => setActiveTab('unstake')}
            >
              Unstake
            </button>
          </div>

          {activeTab === 'stake' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Stake
                </label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="Enter amount to stake"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Staking Duration (days)
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={stakeDuration}
                  onChange={(e) => setStakeDuration(e.target.value)}
                >
                  <option value="30">30 Days</option>
                  <option value="60">60 Days</option>
                  <option value="90">90 Days</option>
                  <option value="180">180 Days</option>
                  <option value="365">365 Days</option>
                </select>
              </div>
              <button
                onClick={stake}
                className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
                disabled={!publicKey || !stakingContract}
              >
                Stake Tokens
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Unstake
                </label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  placeholder="Enter amount to unstake"
                />
              </div>
              <button
                onClick={unstake}
                className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
                disabled={!publicKey || !stakingContract}
              >
                Unstake Tokens
              </button>
            </div>
          )}
        </div>
      </div>

      {(error || message) && (
        <div className="mt-6">
          {error && (
            <div className="p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          {message && (
            <div className="p-4 bg-green-100 text-green-700 rounded">
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;