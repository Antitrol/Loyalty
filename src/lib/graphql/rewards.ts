
import { gql } from 'graphql-request';

export const LIST_CAMPAIGNS = gql`
  query ListCampaigns($filter: CampaignFilterInput) {
    listCampaign(filter: $filter) {
      data {
        id
        title
        type
        hasCoupon
      }
    }
  }
`;

export const CREATE_CAMPAIGN = gql`
  mutation CreateCampaign($input: CreateCampaignInput!) {
    createCampaign(input: $input) {
      id
      title
      type
    }
  }
`;

export const ADD_COUPONS = gql`
  mutation AddCoupons($input: AddCouponsToCampaignInput!) {
    addCouponsToCampaign(input: $input) {
      campaignId
      coupons
    }
  }
`;
