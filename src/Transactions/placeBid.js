import * as fcl from "@onflow/fcl";

/**
 * Place a bid on an existing auction on-chain.
 *
 * Calls BiddingCollection.placeBid() on the admin's collection.
 * The bidder must have:
 *   1. A Tender Collection in /storage/TenderCollection
 *   2. A FungibleToken Receiver in /public/TokenReceiver
 *
 * @param {string} adminAddress - The address of the admin who owns the BiddingCollection (0xea0627a8b29d7901)
 * @param {number|string} biddingId - The on-chain auction ID (UInt64)
 * @param {string} bidAmount - The bid amount as a UFix64 string (e.g., "10.0")
 * @returns {string} Transaction ID
 */
export const placeBidOnChain = async (adminAddress, biddingId, bidAmount) => {
    const transactionId = await fcl.mutate({
        cadence: `
import Biddingplatform from 0xea0627a8b29d7901
import Tender from 0xc9a10bbda7c73177
import FungibleToken from 0xc9a10bbda7c73177

transaction(adminAddress: Address, biddingId: UInt64, bidAmount: UFix64) {

  prepare(bidder: AuthAccount) {

    // Get the bidder's vault capability (to receive refund if outbid)
    let vaultCap = bidder.getCapability<&{FungibleToken.Receiver}>(/public/TokenReceiver)

    // Get the bidder's tender collection capability (to receive NFT if winner)
    let collectionCap = bidder.getCapability<&{Tender.CollectionPublic}>(/public/TenderCollection)

    // Borrow the admin's BiddingCollection (public interface)
    let biddingCollection = getAccount(adminAddress)
      .getCapability(/public/BiddingCollection)
      .borrow<&Biddingplatform.BiddingCollection{Biddingplatform.BiddingPublic}>()
      ?? panic("Could not borrow admin's BiddingCollection")

    // Place the bid on-chain
    biddingCollection.placeBid(
      id: biddingId,
      bidTokens: bidAmount,
      collectionCap: collectionCap,
      vaultCap: vaultCap
    )
  }

  execute {
    log("Bid placed successfully on-chain")
  }
}
`,
        args: (arg, t) => [
            arg(adminAddress, t.Address),
            arg(String(biddingId), t.UInt64),
            arg(bidAmount, t.UFix64),
        ],
        proposer: fcl.currentUser,
        payer: fcl.currentUser,
        authorizations: [fcl.currentUser],
        limit: 100,
    });

    // Wait for the transaction to be sealed (confirmed on-chain)
    const transaction = await fcl.tx(transactionId).onceSealed();
    console.log("✅ Bid placed on-chain:", transaction);

    return transactionId;
};
