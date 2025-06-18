# DID-ION__ONCHAIN_BTC

## Setup

Create a `.env` file in the project root with the following variables:

```dotenv
PORT=3000
NODE_ENV=development

# Fireblocks Configuration
FIREBLOCKS_API_KEY=3049c87c-199f-49d6-be04-ba098a402b35
FIREBLOCKS_SECRET_KEY_PATH=./fireblock.pem
FIREBLOCKS_BASE_URL=https://sandbox-api.fireblocks.io

# Investor Configuration
INVESTOR_ID=test-investor-001
VAULT_NAME=Investor_DID_Vault
VAULT_ACCOUNT_ID=23
```