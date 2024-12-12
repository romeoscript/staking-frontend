import { Buffer } from 'buffer';

window.Buffer = Buffer;

import React, { useState, useEffect } from "react";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, BN, web3 } from "@project-serum/anchor";
import {
  PublicKey,
  SystemProgram,
  Keypair,
  Connection,
  Commitment,
  Transaction,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";
import idlData from "./idl.json"; // Import the IDL
import { Idl } from "@project-serum/anchor";
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  AccountLayout,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  createMint,
  mintTo,
  transfer,
} from "@solana/spl-token";
// import { Token } from '@solana/spl-token';
import iddl from "../../target/idl/staking_contract.json";
import type { StakingContract } from "../../target/types/staking_contract";

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
  const [tokenBalance, setTokenBalance] = useState(0);
  const [masterContract, setMasterContract] = useState<string | null>(null);
  const [stakingContract, setStakingContract] = useState<string | null>(null);
  const [poolName, setPoolName] = useState<string>("");
  const [stakeAmount, setStakeAmount] = useState<number | string>("");
  const [unstakeAmount, setUnstakeAmount] = useState<number | string>("");
  const tokenMint = "3hA3XL7h84N1beFWt3gwSRCDAf5kwZu81Mf1cpUHKzce";

  const [balance, setBalance] = useState<number>(0);
  const connection = new Connection(network);

  const wallet = useWallet();

  const { publicKey, connected, signTransaction } = wallet;

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

  // (async () => {

  //   const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  //   const tokenAccounts = await connection.getTokenAccountsByOwner(
  //     new PublicKey('25mwXtqvNTnQd9Xx9SdypyNv8DZR2bwGgzSnSPKVWstq'),
  //     {
  //       programId: TOKEN_PROGRAM_ID,
  //     }
  //   );

  //   console.log("Token                                         Balance");
  //   console.log("------------------------------------------------------------");
  //   tokenAccounts.value.forEach((tokenAccount) => {
  //     const accountData = AccountLayout.decode(tokenAccount.account.data);
  //     console.log(`${new PublicKey(accountData.mint)}   ${accountData.amount}`);
  //   })

  // })();

  //   (async () => {
  //     // Connect to cluster
  //     const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  //     // Generate a new wallet keypair and airdrop SOL
  //     const fromWallet = Keypair.generate();
  //     // const fromAirdropSignature = await connection.requestAirdrop(fromWallet.publicKey, LAMPORTS_PER_SOL);

  //     // Wait for airdrop confirmation
  //     // await connection.confirmTransaction(fromAirdropSignature);

  //     // Generate a new wallet to receive newly minted token
  //     const toWallet = Keypair.generate();

  //     // Create new token mint
  //     const mint = await createMint(connection, fromWallet, fromWallet.publicKey, null, 9);

  //     // Get the token account of the fromWallet address, and if it does not exist, create it
  //     const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
  //         connection,
  //         fromWallet,
  //         mint,
  //         fromWallet.publicKey
  //     );

  //     // Get the token account of the toWallet address, and if it does not exist, create it
  //     const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromWallet, mint, toWallet.publicKey);

  //     // Mint 1 new token to the "fromTokenAccount" account we just created
  //     let signature = await mintTo(
  //         connection,
  //         fromWallet,
  //         mint,
  //         fromTokenAccount.address,
  //         fromWallet.publicKey,
  //         1000000000
  //     );
  //     console.log('mint tx:', signature);

  //     // Transfer the new token to the "toTokenAccount" we just created
  //     signature = await transfer(
  //         connection,
  //         fromWallet,
  //         fromTokenAccount.address,
  //         toTokenAccount.address,
  //         fromWallet.publicKey,
  //         50
  //     );
  // })();

  // (async () => {
  //   // setLoading(true);
  //   try {
  //     if (publicKey && connection) {
  //       const publicKeys = new PublicKey(publicKey);
  //       const senderAssociatedTokenAccount = await getAssociatedTokenAddress(
  //         new PublicKey("3hA3XL7h84N1beFWt3gwSRCDAf5kwZu81Mf1cpUHKzce"),
  //         publicKeys,
  //         false,
  //         TOKEN_PROGRAM_ID,
  //         ASSOCIATED_TOKEN_PROGRAM_ID,
  //       );
  //       const tokenAccountInfo = await connection.getAccountInfo(senderAssociatedTokenAccount);
  //       if (tokenAccountInfo) {
  //         const tokenAccountData = AccountLayout.decode(tokenAccountInfo.data);
  //         const balance = Number(tokenAccountData.amount) / 10 ** 9;
  //         setTokenBalance(balance);
  //       } else {
  //         setTokenBalance(0);
  //       }
  //     }
  //     setError(null);
  //   } catch (error) {
  //     if (error instanceof Error) {
  //       setError('Error fetching BARK token balance: ' + error.message);
  //     } else {
  //       setError('An unknown error occurred.');
  //     }
  //   }
  // })();

  // Create Staking Contract
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
    // Fetch the staking contract details to get the correct token mint
    // let stakingContractDetails;
    // try {
    //   stakingContractDetails = await program.account.stakingContract.fetch(stakingContractPubkey); }
    // catch (err)
    // {
    //   console.error("Error fetching staking contract details:", err);
    //   setError("Error fetching staking contract details."); return;
    // }
    // const tokenMintAddress = stakingContractDetails.tokenMint;

    // Get user token account
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

    //   const userTokenAccountInfo = await provider.connection.getParsedAccountInfo(
    //     userTokenAccount
    //   );
    //   // console.log("User Token Account Info:", userTokenAccountInfo);
    //   const stakingContractDetails = await program.account.stakingContract.fetch(
    //     stakingContractPubkey
    //   );
    //   const expectedTokenMint = stakingContractDetails?.tokenMint?.toString();
    // console.log("Expected Token Mint Address:", expectedTokenMint);

    //   const stakingContractDetailss = await program.account.stakingContract.fetch(stakingContractPubkey);
    // const tokenMintAddresss = stakingContractDetailss.tokenMint.toString();
    // console.log("Expected token mint address:", tokenMintAddresss);
    // const userTokenMint = userTokenAccountInfo.value?.data?.parsed?.info?.mint;
    // console.log("User Token Mint Address:", userTokenMint);
    //   console.log(userTokenAccount.toString(), stakingTokenAccount.toString())
    //   console.log("Stake Parameters:", {
    //     stakingContract: stakingContractPubkey.toString(),
    //     user: provider.wallet.publicKey.toString(),
    //     userTokenAccount: userTokenAccount.toString(),
    //     stakingTokenAccount: stakingTokenAccount.toString(),
    //     tokenProgram: TOKEN_PROGRAM_ID.toString(),
    //   });

    // Proceed to stake
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
      // Derive the correct userBalance PDA
      // const [userBalance, bump] = await PublicKey.findProgramAddress(
      //   [
      //     Buffer.from("user_balance"),
      //     provider.wallet.publicKey.toBuffer(),
      //     new PublicKey(stakingContract).toBuffer(),
      //   ],
      //   program.programId
      // );

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

// import React from 'react';
// import WalletConnect from './WalletConnect';
// import Staking from './Staking';

// const App: React.FC = () => {
//   return (
//     <div className="App">
//       <h1>Solana Staking Dapp</h1>
//       <WalletConnect />
//       <Staking />
//     </div>
//   );
// };

// export default App;
