import * as fcl from "@onflow/fcl";

/**
 * Settle an expired auction on-chain.
 *
 * Only the admin (collection owner) can call this.
 * This transaction:
 *   1. Checks the auction has expired
 *   2. Transfers the NFT to the winning bidder
 *   3. Settles the bid tokens to the owner
 *   4. Emits the Settled event
 *
 * @param {number|string} biddingId - The on-chain auction ID (UInt64)
 * @returns {string} Transaction ID
 */
export const settleBiddingOnChain = async (biddingId) => {
    const transactionId = await fcl.mutate({
        cadence: `
import Biddingplatform from 0xea0627a8b29d7901
import Tender from 0xc9a10bbda7c73177
import FungibleToken from 0xc9a10bbda7c73177

transaction(biddingId: UInt64) {

  prepare(admin: AuthAccount) {

    // Borrow the admin's BiddingCollection from storage (requires owner access)
    let biddingCollection = admin.borrow<&Biddingplatform.BiddingCollection>(
      from: /storage/BiddingCollection
    ) ?? panic("Could not borrow BiddingCollection from admin storage")

    // Settle the auction on-chain
    // This will:
    //   - Check auction has expired (pre-condition in contract)
    //   - Transfer NFT to winning bidder's collection
    //   - Transfer bid tokens to auction owner
    //   - Emit Settled event
    biddingCollection.settleBidding(biddingId)
  }

  execute {
    log("Auction settled successfully on-chain")
  }
}
`,
        args: (arg, t) => [arg(String(biddingId), t.UInt64)],
        proposer: fcl.currentUser,
        payer: fcl.currentUser,
        authorizations: [fcl.currentUser],
        limit: 200,
    });

    // Wait for the transaction to be sealed (confirmed on-chain)
    const transaction = await fcl.tx(transactionId).onceSealed();
    console.log("✅ Auction settled on-chain:", transaction);

    return transactionId;
};
