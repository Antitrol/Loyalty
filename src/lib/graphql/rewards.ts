
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
  mutation UpdateCampaignWithCoupon($id: ID!, $input: UpdateCampaignInput!) {
    updateCampaign(id: $id, input: $input) {
      id
      title
    }
  }
`;

export const GENERATE_COUPONS = gql`
  mutation GenerateCoupons($campaignId: ID!, $count: Int!, $prefix: String) {
    generateCampaignCoupons(campaignId: $campaignId, count: $count, prefix: $prefix) {
      success
      count
    }
  }
`;

export const GET_CAMPAIGN_COUPONS = gql`
  query GetCampaignCoupons($limit: Int, $offset: Int) {
    listCampaign(filter: { hasCoupon: true }) {
      data {
        id
        title
        coupons(limit: $limit, offset: $offset) {
          data {
            code
            usageCount
            usageLimit
          }
          total
        }
      }
    }
  }
`;
