import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
// import { WalletError } from '@solana/wallet-adapter-base';
// import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
// import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

// const wallets = [new PhantomWalletAdapter()];
// const rootElement = document.getElementById("root");
// const root = createRoot(rootElement);
  // const onError = useCallback((error: WalletError) => {
  //   console.error(error);
  // }, []);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConnectionProvider endpoint="http://127.0.0.1:8899">
      {" "}
      {/* Use your desired network */}
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </StrictMode>,
)


// import React from "react";
// import { createRoot } from "react-dom/client";
// import "./index.css";
// import App from "./App";
// import {
//   ConnectionProvider,
//   WalletProvider,
// } from "@solana/wallet-adapter-react";
// import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
// import { clusterApiUrl } from "@solana/web3.js";
// import "@solana/wallet-adapter-react-ui/styles.css";
// import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

// const wallets = [new PhantomWalletAdapter()];
// const rootElement = document.getElementById("root");
// const root = createRoot(rootElement);

// root.render(
//   <React.StrictMode>
//     <ConnectionProvider endpoint="http://127.0.0.1:8899">
//       {" "}
//       {/* Use your desired network */}
//       <WalletProvider wallets={wallets} autoConnect>
//         <WalletModalProvider>
//           <App />
//         </WalletModalProvider>
//       </WalletProvider>
//     </ConnectionProvider>
//   </React.StrictMode>
// );