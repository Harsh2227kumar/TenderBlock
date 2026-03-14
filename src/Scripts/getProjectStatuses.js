import * as fcl from "@onflow/fcl";

/**
 * Query all project/auction statuses from the admin's BiddingCollection.
 *
 * @param {string} accountAddress - The account address to query (e.g., "0xea0627a8b29d7901")
 * @returns {Object} Dictionary of {UInt64: ProjectStatus}
 */
export const getProjectStatuses = async (accountAddress) => {
  const response = await fcl.query({
    cadence: `
import Biddingplatform from 0xea0627a8b29d7901

pub fun main(account: Address): {UInt64: Biddingplatform.ProjectStatus} {
    let collection = getAccount(account)
      .getCapability(/public/BiddingCollection)
      .borrow<&Biddingplatform.BiddingCollection{Biddingplatform.BiddingPublic}>()
      ?? panic("Can't access the user's BiddingCollection.")

    let biddingDetails = collection.getBiddingStatuses()
    return biddingDetails
}
`,
    args: (arg, t) => [arg(accountAddress, t.Address)],
  });

  return response;
};

/**
 * Query a single project/auction status by ID.
 *
 * @param {string} accountAddress - The account address to query
 * @param {number|string} biddingId - The auction ID (UInt64)
 * @returns {Object} ProjectStatus struct
 */
export const getProjectStatus = async (accountAddress, biddingId) => {
  const response = await fcl.query({
    cadence: `
import Biddingplatform from 0xea0627a8b29d7901

pub fun main(account: Address, id: UInt64): Biddingplatform.ProjectStatus {
    let collection = getAccount(account)
      .getCapability(/public/BiddingCollection)
      .borrow<&Biddingplatform.BiddingCollection{Biddingplatform.BiddingPublic}>()
      ?? panic("Can't access the user's BiddingCollection.")

    return collection.getBiddingStatus(id)
}
`,
    args: (arg, t) => [
      arg(accountAddress, t.Address),
      arg(String(biddingId), t.UInt64),
    ],
  });

  return response;
};
