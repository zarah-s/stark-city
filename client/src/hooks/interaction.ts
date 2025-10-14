import { useDojoSDK } from "@dojoengine/sdk/react";
import { toast } from "react-toastify";

const useInteraction = () => {
  const { client } = useDojoSDK();
  async function call(method: string, ...args: any) {
    try {
      const account = window.Wallet?.Account;
      if (!account) return;
      const tx = await client.actions[method](account, ...args);
      const receipt = await account.waitForTransaction(tx.transaction_hash);
      console.log(receipt);
    } catch (error: any) {
      toast.error(error.message || "OOPPSSS something went wrong");
    }
  }

  return { call };
};

export default useInteraction;
