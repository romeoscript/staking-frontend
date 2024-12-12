import React from 'react';
// import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

const WalletConnect: React.FC = () => {
  const {  connect, disconnect, connected, publicKey } = useWallet();
  
  return (
    <div>
      {connected ? (
        <div>
          <p>Connected to wallet: {publicKey?.toString()}</p>
          <button onClick={() => disconnect()}>Disconnect</button>
        </div>
      ) : (
        <button onClick={() => connect()}>Connect Wallet</button>
      )}
    </div>
  );
};

export default WalletConnect;
