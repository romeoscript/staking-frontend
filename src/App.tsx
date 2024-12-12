import { Buffer } from 'buffer';

window.Buffer = Buffer;

import  { useState } from "react";
import {  useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN, web3 } from "@project-serum/anchor";
import {
  PublicKey,
  SystemProgram,
  Keypair,
  Connection,
  Commitment,
  Transaction,
  LAMPORTS_PER_SOL,
  // clusterApiUrl,
} from "@solana/web3.js";
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";
import idlData from "./idl.json"; // Import the IDL
import { Idl } from "@project-serum/anchor";
import {
  // TOKEN_2022_PROGRAM_ID,
  // ASSOCIATED_TOKEN_PROGRAM_ID,
  // AccountLayout,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  // getOrCreateAssociatedTokenAccount,
  // createMint,
  // mintTo,
  // transfer,
} from "@solana/spl-token";
// import { Token } from '@solana/spl-token';
// import iddl from "../../target/idl/staking_contract.json";
// import type { StakingContract } from "../../target/types/staking_contract";

// Constants
const idl = idlData as unknown as Idl;
const network = "https://api.devnet.solana.com"; // Adjust for your environment
// const network = "http://127.0.0.1:8899"; // Adjust for your environment
const programID = new PublicKey(idlData.address); // Program ID from the IDL
const opts: { preflightCommitment: Commitment } = {
  preflightCommitment: "processed",
};

// Helper function to get the provider
const getProvider = (wallet: any) => {
  const connection = new Connection(network, opts.preflightCommitment);
  return new AnchorProvider(connection, wallet, opts);
};

const App = () => {
  // const wallet = useAnchorWallet();
  const [error, setError] = useState<string | null>(null);
  // const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [tokenBalance, _] = useState(0);
  const [masterContract, setMasterContract] = useState<string | null>(null);
  const [stakingContract, setStakingContract] = useState<string | null>(null);
  const [poolName, setPoolName] = useState<string>("");
  const [stakeAmount, setStakeAmount] = useState<number | string>("");
  const [unstakeAmount, setUnstakeAmount] = useState<number | string>("");
  const tokenMint = "3hA3XL7h84N1beFWt3gwSRCDAf5kwZu81Mf1cpUHKzce";

  const [balance, setBalance] = useState<number>(0);
  const connection = new Connection(network);

  const wallet = useWallet();

  const { publicKey } = wallet;

  const program = new Program(idl, programID, getProvider(wallet));

  const initializeMasterContract = async () => {
    setError("");
    setMessage("");

    if (!wallet) {
      setError("Wallet not connected.");
      return;
    }

    const provider = getProvider(wallet);
    try {
      const masterAccountKeypair = Keypair.generate(); // Create a new master account

      // Call the initializeMaster RPC with the owner argument and accounts
      await program.rpc.initializeMaster(provider.wallet.publicKey, {
        accounts: {
          masterContract: masterAccountKeypair.publicKey, // The master contract account to be initialized
          payer: provider.wallet.publicKey, // The payer (signer) of the transaction
          systemProgram: SystemProgram.programId, // System Program for Solana transactions
        },
        signers: [masterAccountKeypair], // Sign the transaction with the masterAccountKeypair
      });

      setMasterContract(masterAccountKeypair.publicKey.toString());
      setMessage("Master contract initialized successfully.");
    } catch (err) {
      console.error("Error initializing master contract:", err);
      setError("Failed to initialize master contract.");
    }
  };

  // Initialize User Balance
  // const initializeUserBalance = async () => {
  //   setError("");
  //   setMessage("");

  //   if (!wallet || !stakingContract) {
  //     setError("Wallet not connected or staking contract missing.");
  //     return;
  //   }

  //   const provider = getProvider(wallet);

  //   // Ensure stakingContract is not null
  //   if (!stakingContract) {
  //     setError("Staking contract is missing.");
  //     return;
  //   }

  //   const stakingContractPubkey = new web3.PublicKey(stakingContract);
  //   const provwall = new web3.PublicKey(provider.wallet.publicKey)

  //   // Derive the user balance address (PDA)
  //   const [userBalanceAddress, userBalanceBump] = await PublicKey.findProgramAddress(
  //     [
  //       Buffer.from("user_balance"),
  //       provwall.toBuffer(),
  //       stakingContractPubkey.toBuffer(),
  //     ],
  //     new PublicKey(program.programId)
  //   );

  //   const orikey = new web3.PublicKey(userBalanceAddress)

  //   console.log("Derived user balance address:", userBalanceAddress.toString());
  //   console.log("userBalanceAddress:", orikey);
  //   console.log("userBalanceBump:", userBalanceBump);

  //   try {
  //     // Check if the userBalance account exists
  //     const accountInfo = await provider.connection.getAccountInfo(orikey);
  //     if (!accountInfo) {
  //       console.log("User balance account doesn't exist. Initializing the account...");

  //       // Initialize the userBalance account with the `initializeUserBalance` instruction
  //       await program.rpc.initializeUserBalance(userBalanceBump, {
  //         accounts: {
  //           userBalance: orikey, // Pass the derived address directly (not a Keypair)
  //           user: provider.wallet.publicKey,
  //           systemProgram: SystemProgram.programId,
  //         },
  //       });

  //       setMessage("User balance initialized successfully.");
  //     } else {
  //       setMessage("User balance account already exists.");
  //     }
  //   } catch (err) {
  //     console.error("Error initializing user balance:", err);
  //     setError("Failed to initialize user balance.");
  //   }

  // };

  const fetchBalance = async () => {
    if (publicKey && connection) {
      try {
        const walletBalance = await connection.getBalance(
          new PublicKey(publicKey)
        );
        setBalance(walletBalance / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    }
  };

 
  const createStakingContract = async (tokenMint: web3.PublicKeyInitData) => {
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
      const stakingPoolKeypair = Keypair.generate(); // Create a new staking pool account

      // Ensure that masterContract is a valid PublicKey
      const masterContractPublicKey = new PublicKey(masterContract);

      // Ensure that tokenMint is a valid PublicKey
      const tokenMintPublicKey = new PublicKey(tokenMint);

      // Call the createStakingContract RPC with the necessary arguments
      await program.rpc.createStakingContract(poolName, tokenMintPublicKey, {
        accounts: {
          owner: provider.wallet.publicKey, // Pass the owner (wallet public key)
          masterContract: masterContractPublicKey, // Pass the master contract public key
          stakingContract: stakingPoolKeypair.publicKey, // The staking pool account
          systemProgram: SystemProgram.programId, // System Program for native Solana transactions
        },
        signers: [stakingPoolKeypair], // Sign the transaction with the staking pool keypair
      });

      setStakingContract(stakingPoolKeypair.publicKey.toString());
      setMessage("Staking contract created successfully.");
    } catch (err) {
      console.error("Error creating staking contract:", err);
      setError("Failed to create staking contract.");
    }
  };

  // Stake
  const stake = async () => {
    setError("");
    setMessage("");

    if (!wallet || !stakeAmount || !stakingContract) {
      setError("Wallet not connected or stake amount missing.");
      return;
    }

    const provider = getProvider(wallet);

    // Check if stakingContract is not null and convert it to PublicKey
    if (!stakingContract) {
      setError("Staking contract is missing.");
      return;
    }

    const stakingContractPubkey = new PublicKey(stakingContract);

    let userTokenAccount;
    try {
      userTokenAccount = await getAssociatedTokenAddress(
        new PublicKey("3hA3XL7h84N1beFWt3gwSRCDAf5kwZu81Mf1cpUHKzce"), // Token's mint address (user's token mint)
        provider.wallet.publicKey
      );
    } catch (err) {
      console.error("Error getting user token account:", err);
      setError("Error getting user token account.");
      return;
    }

    // Ensure the user has an associated token account; create if necessary
    const associatedTokenAccountInfo = await provider.connection.getAccountInfo(
      userTokenAccount
    );
    if (!associatedTokenAccountInfo) {
      // Create an associated token account if it doesn't exist
      const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          provider.wallet.publicKey, // payer (user)
          userTokenAccount, // new associated token account
          provider.wallet.publicKey, // owner of the token account
          new PublicKey("3hA3XL7h84N1beFWt3gwSRCDAf5kwZu81Mf1cpUHKzce") // Token's mint address
          // TOKEN_2022_PROGRAM_ID, // Token Program ID
          // ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );

      try {
        await provider.sendAndConfirm(transaction);
        console.log(
          "Created associated token account:",
          userTokenAccount.toString()
        );
      } catch (err) {
        console.error("Error creating associated token account:", err);
        setError("Failed to create associated token account.");
        return;
      }
    } else {
      console.log(associatedTokenAccountInfo);
    }

    // Get or create the staking token account
    let stakingTokenAccount;
    try {
      stakingTokenAccount = await getAssociatedTokenAddress(
        new PublicKey("3hA3XL7h84N1beFWt3gwSRCDAf5kwZu81Mf1cpUHKzce"), // Staking token mint address
        stakingContractPubkey
      );
    } catch (err) {
      console.error("Error getting staking token account:", err);
      setError("Error getting staking token account.");
      return;
    }

    // Ensure the staking token account exists; create if necessary
    const stakingTokenAccountInfo = await provider.connection.getAccountInfo(
      stakingTokenAccount
    );
    if (!stakingTokenAccountInfo) {
      // Create the staking token account if it doesn't exist
      const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          provider.wallet.publicKey, // payer (user)
          stakingTokenAccount, // new associated staking token account
          stakingContractPubkey, // owner of the token account
          new PublicKey("3hA3XL7h84N1beFWt3gwSRCDAf5kwZu81Mf1cpUHKzce") // Staking token's mint address
          // TOKEN_2022_PROGRAM_ID, // Token Program ID
          // ASSOCIATED_TOKEN_PROGRAM_ID // Associated Token Program ID
        )
      );

      try {
        await provider.sendAndConfirm(transaction);
        console.log(
          "Created associated staking token account:",
          stakingTokenAccount.toString()
        );
      } catch (err) {
        console.error("Error creating staking token account:", err);
        setError("Failed to create staking token account.");
        return;
      }
    } else {
      console.log(associatedTokenAccountInfo);
    }
    try {
      await program.rpc.stake(new BN(stakeAmount), {
        accounts: {
          stakingContract: stakingContractPubkey,
          user: provider.wallet.publicKey,
          userTokenAccount: userTokenAccount, // Add the user token account
          stakingTokenAccount: stakingTokenAccount, // Add the staking token account
          tokenProgram: TOKEN_PROGRAM_ID, // Correct Token Program ID
        },
      });
      setMessage("Stake successful.");
    } catch (err) {
      console.error("Error staking:", err);
      setError("Failed to stake.");
    }
  };

  // // Unstake
  const unstake = async () => {
    setError("");
    setMessage("");
    if (!wallet || !unstakeAmount || !stakingContract) {
      setError("Wallet not connected or unstake amount missing.");
      return;
    }

    const provider = getProvider(wallet);
    try {
     

      let userTokenAccount;
      try {
        userTokenAccount = await getAssociatedTokenAddress(
          new PublicKey("3hA3XL7h84N1beFWt3gwSRCDAf5kwZu81Mf1cpUHKzce"), // Token's mint address (user's token mint)
          provider.wallet.publicKey
        );
      } catch (err) {
        console.error("Error getting user token account:", err);
        setError("Error getting user token account.");
        return;
      }

      // Ensure the user has an associated token account; create if necessary
      const associatedTokenAccountInfo =
        await provider.connection.getAccountInfo(userTokenAccount);
      if (!associatedTokenAccountInfo) {
        // Create an associated token account if it doesn't exist
        const transaction = new Transaction().add(
          createAssociatedTokenAccountInstruction(
            provider.wallet.publicKey, // payer (user)
            userTokenAccount, // new associated token account
            provider.wallet.publicKey, // owner of the token account
            new PublicKey("3hA3XL7h84N1beFWt3gwSRCDAf5kwZu81Mf1cpUHKzce") // Token's mint address
            // TOKEN_2022_PROGRAM_ID, // Token Program ID
            // ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );

        try {
          await provider.sendAndConfirm(transaction);
          console.log(
            "Created associated token account:",
            userTokenAccount.toString()
          );
        } catch (err) {
          console.error("Error creating associated token account:", err);
          setError("Failed to create associated token account.");
          return;
        }
      } else {
        console.log(associatedTokenAccountInfo);
      }

      const stakingContractPubkey = new PublicKey(stakingContract);
      let stakingTokenAccount;
      try {
        stakingTokenAccount = await getAssociatedTokenAddress(
          new PublicKey("3hA3XL7h84N1beFWt3gwSRCDAf5kwZu81Mf1cpUHKzce"), // Staking token mint address
          stakingContractPubkey
        );
      } catch (err) {
        console.error("Error getting staking token account:", err);
        setError("Error getting staking token account.");
        return;
      }

      // Ensure the staking token account exists; create if necessary
      const stakingTokenAccountInfo = await provider.connection.getAccountInfo(
        stakingTokenAccount
      );
      if (!stakingTokenAccountInfo) {
        // Create the staking token account if it doesn't exist
        const transaction = new Transaction().add(
          createAssociatedTokenAccountInstruction(
            provider.wallet.publicKey, // payer (user)
            stakingTokenAccount, // new associated staking token account
            stakingContractPubkey, // owner of the token account
            new PublicKey("3hA3XL7h84N1beFWt3gwSRCDAf5kwZu81Mf1cpUHKzce") // Staking token's mint address
            // TOKEN_2022_PROGRAM_ID, // Token Program ID
            // ASSOCIATED_TOKEN_PROGRAM_ID // Associated Token Program ID
          )
        );

        try {
          await provider.sendAndConfirm(transaction);
          console.log(
            "Created associated staking token account:",
            stakingTokenAccount.toString()
          );
        } catch (err) {
          console.error("Error creating staking token account:", err);
          setError("Failed to create staking token account.");
          return;
        }
      } else {
        console.log(associatedTokenAccountInfo);
      }

      console.log(stakingContractPubkey.toString());

      // Call the unstake function on the program
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

  // Render the application
  return (
    <div>
      <h1>Solana Token Staking</h1>
      <div>
        <WalletMultiButton />
        <WalletDisconnectButton />
      </div>
      <div>
        <h2>Create Master Contract</h2>
        <button onClick={initializeMasterContract}>
          Create Master Contract
        </button>
        <h2>Initialize User Balance</h2>
        <p>{balance}</p>
        <button onClick={fetchBalance}>Initialize User Balance</button>
        <h2>Create Staking Contract</h2>
        <input
          type="text"
          placeholder="Pool Name"
          value={poolName}
          onChange={(e) => setPoolName(e.target.value)}
        />
        <button onClick={() => createStakingContract(tokenMint)}>
          Create Staking Contract
        </button>
        <h2>Stake</h2>
        <input
          type="number"
          placeholder="Stake Amount"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
        />
        <button onClick={stake}>Stake</button>
        <h2>Unstake</h2>
        <input
          type="number"
          placeholder="Unstake Amount"
          value={unstakeAmount}
          onChange={(e) => setUnstakeAmount(e.target.value)}
        />
        <button onClick={unstake}>Unstake</button>
      </div>
      <h2>Initialize User Token Balance</h2>
      <p>{tokenBalance}</p>
      <div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {message && <p style={{ color: "green" }}>{message}</p>}
      </div>
    </div>
  );
};

export default App;
