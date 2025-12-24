
import { gql } from 'graphql-request';

export const GET_CUSTOMER_LOYALTY_DATA = gql`
  query getCustomerLoyaltyData($id: String!) {
    listCustomer(id: { eq: $id }, pagination: { limit: 1 }) {
      data {
        id
        firstName
        lastName
        email
        tags {
           name
        }
      }
    }
  }
`;

export const UPDATE_CUSTOMER_TAGS = gql`
  mutation updateCustomerTags($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
      tags {
        name
      }
    }
  }
`;

export const SAVE_CUSTOMER = gql`
  mutation saveCustomer($input: CreateCustomerInput!) {
    createCustomer(input: $input) {
      id
      firstName
      lastName
      email
    }
  }
`;

export const GET_CUSTOMERS = gql`
  query getCustomers {
    listCustomer(pagination: { limit: 1 }) {
      count
      data {
        id
        firstName
        lastName
        email
      }
    }
  }
`;
