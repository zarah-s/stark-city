const {
  Account,
  CallData,
  Contract,
  RpcProvider,
  stark,
  RPC,
  num,
} = require("starknet");
require("dotenv").config();
const fs = require("fs");
const { getCompiledCode } = require("./utils");
// dotenv.config();

async function main() {
  const provider = new RpcProvider({
    nodeUrl: process.env.RPC_URL,
  });

  // initialize existing predeployed account 0
  console.log("ACCOUNT_ADDRESS=", process.env.ACCOUNT_ADDRESS);
  console.log("ACCOUNT_PRIVATE_KEY=", process.env.PRIVATE_KEY);
  const privateKey0 = process.env.PRIVATE_KEY ?? "";
  const accountAddress0 = process.env.ACCOUNT_ADDRESS ?? "";
  const account0 = new Account(provider, accountAddress0, privateKey0);
  console.log("Account connected.\n");

  // Declare & deploy contract
  let sierraCode, casmCode;

  try {
    ({ sierraCode, casmCode } = await getCompiledCode("starkcity_PropertyNFT"));
  } catch (error) {
    console.log("Failed to read contract files");
    console.log(error);
    process.exit(1);
  }

  const myCallData = new CallData(sierraCode.abi);

  const constructor = myCallData.compile("constructor", {
    game_contract:
      "0x128d5e9692d1c162ed7a7992403c413f18a3baf5e32a5905877273d0c1952e2",
  });

  const maxQtyGasAuthorized = 1800n * 1000n; // max quantity of gas authorized
  const maxPriceAuthorizeForOneGas = 50n * 10n ** 12n * 1000n; // max FRI authorized to pay 1 gas (1 FRI=10**-18 STRK)
  console.log(
    "max authorized cost =",
    maxQtyGasAuthorized * maxPriceAuthorizeForOneGas,
    "FRI"
  );

  const val = await account0.estimateDeclareFee({
    contract: sierraCode,
    casm: casmCode,
  });

  console.log(val.resourceBounds);
  const declared = await account0.declare(
    {
      contract: sierraCode,
      casm: casmCode,
    },
    {
      maxFee: 10 ** 15,
      feeDataAvailabilityMode: RPC.EDataAvailabilityMode.L1,
      resourceBounds: val.resourceBounds,
    }
  );
  await provider.waitForTransaction(declared.transaction_hash);
  console.log(declared);
  const deployed = await account0.deployContract({
    classHash: declared.class_hash,
    constructorCalldata: constructor,
    salt: stark.randomAddress(),
  });

  fs.writeFile("deploy.json", JSON.stringify(deployed, null, 2), (err) => {
    if (err) {
      console.error("Error writing file:", err);
    } else {
      console.log("Object successfully written to deploy.json");
    }
  });

  console.log(deployed);

  //   const deployResponse = await account0.declareAndDeploy({
  //     contract: sierraCode,
  //     casm: casmCode,
  //     constructorCalldata: constructor,
  //     salt: stark.randomAddress(),
  //   });

  //   // Connect the new contract instance :
  //   const myTestContract = new Contract(
  //     sierraCode.abi,
  //     deployResponse.deploy.contract_address,
  //     provider
  //   );
  //   console.log(
  //     `✅ Contract has been deploy with the address: ${myTestContract.address}`
  //   );
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
