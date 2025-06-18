// scripts/2-create-did.js - Create DID:ION Identity for Investor
import dotenv from 'dotenv';
import fs from 'fs';
import { webcrypto } from 'node:crypto';

// Required polyfill for Node.js compatibility
if (!globalThis.crypto) globalThis.crypto = webcrypto;

// Import ION Tools (easier to use than the low-level SDK)
import { DID, generateKeyPair } from '@decentralized-identity/ion-tools';

// Load environment variables
dotenv.config();

console.log('🆔 Starting DID:ION Creation...');
console.log('📁 Current directory:', process.cwd());

// Console colors for better output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bright: '\x1b[1m'
};

class DIDCreator {
    constructor() {
        console.log('🏗️ Initializing DID Creator...');
        this.investorId = process.env.INVESTOR_ID || 'investor-001';
        this.btcAddress = process.env.BTC_WALLET_ADDRESS;
        this.ethAddress = process.env.ETH_WALLET_ADDRESS;
        this.solAddress = process.env.SOL_WALLET_ADDRESS;
        
        this.didInstance = null;
        this.didKeys = {};
        this.longFormDid = null;
        this.shortFormDid = null;
        this.errors = {};
        
        console.log('📋 Investor ID:', this.investorId);
        console.log('🔗 BTC Address:', this.btcAddress || 'Not found');
        console.log('🔗 ETH Address:', this.ethAddress || 'Not found');
        console.log('🔗 SOL Address:', this.solAddress || 'Not found');
    }

    validateWalletAddresses() {
        console.log(`\n${colors.cyan}${colors.bright}🔍 STEP 1: Validating Wallet Addresses${colors.reset}`);
        console.log('═'.repeat(60));

        const requiredAddresses = {
            'Bitcoin Testnet': this.btcAddress,
            'Ethereum Sepolia': this.ethAddress,
            'Solana Devnet': this.solAddress
        };

        let allValid = true;
        
        for (const [network, address] of Object.entries(requiredAddresses)) {
            if (!address) {
                console.log(`${colors.red}❌ Missing ${network} address${colors.reset}`);
                allValid = false;
            } else {
                console.log(`${colors.green}✅ ${network}: ${address}${colors.reset}`);
                
                // Basic validation
                if (network === 'Bitcoin Testnet' && !address.startsWith('tb1')) {
                    console.log(`${colors.yellow}⚠️ Warning: BTC address format unusual${colors.reset}`);
                }
                if (network === 'Ethereum Sepolia' && !address.startsWith('0x')) {
                    console.log(`${colors.yellow}⚠️ Warning: ETH address format unusual${colors.reset}`);
                }
            }
        }

        if (!allValid) {
            throw new Error('Missing required wallet addresses. Run wallet extraction first.');
        }

        console.log(`${colors.green}✅ All wallet addresses validated${colors.reset}`);
        return true;
    }

    async generateDIDKeys() {
        try {
            console.log(`\n${colors.cyan}${colors.bright}🔐 STEP 2: Generating DID Keys${colors.reset}`);
            console.log('═'.repeat(60));

            console.log('🔧 Generating cryptographic key pairs...');
            
            // Generate keys for DID operations using ION Tools
            console.log('📝 Creating authentication keys...');
            const authnKeys = await generateKeyPair();
            
            console.log('🔄 Creating update keys...');
            const updateKeys = await generateKeyPair();
            
            console.log('🔄 Creating recovery keys...');
            const recoveryKeys = await generateKeyPair();

            this.didKeys = {
                authentication: {
                    id: 'auth-key-1',
                    keyPair: authnKeys,
                    publicKeyJwk: authnKeys.publicJwk,
                    privateKeyJwk: authnKeys.privateJwk
                },
                update: {
                    keyPair: updateKeys,
                    publicKeyJwk: updateKeys.publicJwk,
                    privateKeyJwk: updateKeys.privateJwk
                },
                recovery: {
                    keyPair: recoveryKeys,
                    publicKeyJwk: recoveryKeys.publicJwk,
                    privateKeyJwk: recoveryKeys.privateJwk
                }
            };

            console.log(`${colors.green}✅ DID keys generated successfully${colors.reset}`);
            console.log(`${colors.blue}🔑 Authentication key ID: ${this.didKeys.authentication.id}${colors.reset}`);
            console.log(`${colors.blue}📊 Key type: ${authnKeys.publicJwk.kty}${colors.reset}`);
            console.log(`${colors.blue}📊 Curve: ${authnKeys.publicJwk.crv}${colors.reset}`);

            return this.didKeys;

        } catch (error) {
            console.error(`${colors.red}❌ Failed to generate DID keys:${colors.reset}`);
            console.error('Error details:', error.message);
            this.errors.keyGeneration = error.message;
            throw error;
        }
    }

    async createDIDInstance() {
        try {
            console.log(`\n${colors.cyan}${colors.bright}📄 STEP 3: Creating DID Instance${colors.reset}`);
            console.log('═'.repeat(60));

            console.log('📝 Building DID document with wallet information...');

            // Create DID instance using ION Tools
            this.didInstance = new DID({
                content: {
                    publicKeys: [
                        {
                            id: this.didKeys.authentication.id,
                            type: 'EcdsaSecp256k1VerificationKey2019',
                            publicKeyJwk: this.didKeys.authentication.publicKeyJwk,
                            purposes: ['authentication']
                        }
                    ],
                    services: [
                        {
                            id: 'investor-profile',
                            type: 'InvestorProfile',
                            serviceEndpoint: {
                                id: this.investorId,
                                btc: this.btcAddress,
                                eth: this.ethAddress,
                                sol: this.solAddress
                            }
                        }
                    ]
                }
            });

            console.log(`${colors.green}✅ DID instance created${colors.reset}`);
            console.log(`${colors.blue}📝 Public keys: 1${colors.reset}`);
            console.log(`${colors.blue}🔗 Service endpoints: 1${colors.reset}`);
            console.log(`${colors.blue}👤 Investor ID: ${this.investorId}${colors.reset}`);

            return this.didInstance;

        } catch (error) {
            console.error(`${colors.red}❌ Failed to create DID instance:${colors.reset}`);
            console.error('Error details:', error.message);
            this.errors.didCreation = error.message;
            throw error;
        }
    }

    async generateLongFormDID() {
        try {
            console.log(`\n${colors.cyan}${colors.bright}🆔 STEP 4: Generating Long-Form DID${colors.reset}`);
            console.log('═'.repeat(60));

            console.log('🔧 Creating long-form DID URI...');

            // Generate the long-form DID URI
            this.longFormDid = await this.didInstance.getURI();

            // Extract short-form DID
            this.shortFormDid = this.longFormDid.split('?')[0];

            console.log(`${colors.green}✅ Long-form DID created${colors.reset}`);
            console.log(`${colors.blue}🆔 Long DID: ${this.longFormDid.substring(0, 80)}...${colors.reset}`);
            console.log(`${colors.blue}📄 Short DID: ${this.shortFormDid}${colors.reset}`);
            console.log(`${colors.blue}📏 Length: ${this.longFormDid.length} characters${colors.reset}`);

            return this.longFormDid;

        } catch (error) {
            console.error(`${colors.red}❌ Failed to generate long-form DID:${colors.reset}`);
            console.error('Error details:', error.message);
            this.errors.longFormDid = error.message;
            throw error;
        }
    }

    async getCreateRequest() {
        try {
            console.log(`\n${colors.cyan}${colors.bright}🚀 STEP 5: Getting Create Request${colors.reset}`);
            console.log('═'.repeat(60));

            console.log('🔧 Retrieving ION create request...');

            // Get the create request (operation 0 is the create operation)
            const createRequest = await this.didInstance.generateRequest(0);

            console.log(`${colors.green}✅ Create request generated${colors.reset}`);
            console.log(`${colors.blue}📊 Request type: ${createRequest.type}${colors.reset}`);
            console.log(`${colors.blue}📦 Has suffix data: ${!!createRequest.suffixData}${colors.reset}`);
            console.log(`${colors.blue}📦 Has delta: ${!!createRequest.delta}${colors.reset}`);

            return createRequest;

        } catch (error) {
            console.error(`${colors.red}❌ Failed to get create request:${colors.reset}`);
            console.error('Error details:', error.message);
            this.errors.createRequest = error.message;
            throw error;
        }
    }

    async saveDIDData() {
        try {
            console.log(`\n${colors.cyan}${colors.bright}💾 STEP 6: Saving DID Data${colors.reset}`);
            console.log('═'.repeat(60));

            // Create data directory if it doesn't exist
            const dataDir = './data';
            if (!fs.existsSync(dataDir)) {
                console.log('📁 Creating data directory...');
                fs.mkdirSync(dataDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const didIdentifier = this.shortFormDid.split(':').pop();

            // Get the create request for saving
            const createRequest = await this.getCreateRequest();

            // Get all operations for comprehensive storage
            const allOperations = await this.didInstance.getAllOperations();

            // Save comprehensive DID data
            const didData = {
                metadata: {
                    created: new Date().toISOString(),
                    investorId: this.investorId,
                    didIdentifier: didIdentifier,
                    wallets: {
                        bitcoin: this.btcAddress,
                        ethereum: this.ethAddress,
                        solana: this.solAddress
                    }
                },
                did: {
                    longForm: this.longFormDid,
                    shortForm: this.shortFormDid
                },
                keys: {
                    authentication: {
                        id: this.didKeys.authentication.id,
                        publicKeyJwk: this.didKeys.authentication.publicKeyJwk,
                        privateKeyJwk: this.didKeys.authentication.privateKeyJwk
                    },
                    update: {
                        publicKeyJwk: this.didKeys.update.publicKeyJwk,
                        privateKeyJwk: this.didKeys.update.privateKeyJwk
                    },
                    recovery: {
                        publicKeyJwk: this.didKeys.recovery.publicKeyJwk,
                        privateKeyJwk: this.didKeys.recovery.privateKeyJwk
                    }
                },
                operations: {
                    createRequest: createRequest,
                    allOperations: allOperations
                }
            };

            // Save to files
            const didDataFile = `${dataDir}/did-${this.investorId}-${timestamp}.json`;
            const didKeysFile = `${dataDir}/did-keys-${this.investorId}-${timestamp}.json`;
            const didPublicFile = `${dataDir}/did-public-${this.investorId}.json`;

            console.log('💾 Saving DID data...');
            fs.writeFileSync(didDataFile, JSON.stringify(didData, null, 2));
            console.log(`✅ Complete DID data: ${didDataFile}`);

            console.log('🔐 Saving private keys (secure)...');
            fs.writeFileSync(didKeysFile, JSON.stringify(didData.keys, null, 2));
            console.log(`✅ Private keys: ${didKeysFile}`);

            // Public data (safe to share)
            const publicData = {
                did: {
                    longForm: this.longFormDid,
                    shortForm: this.shortFormDid
                },
                publicKeys: {
                    authentication: this.didKeys.authentication.publicKeyJwk,
                    update: this.didKeys.update.publicKeyJwk,
                    recovery: this.didKeys.recovery.publicKeyJwk
                },
                metadata: didData.metadata,
                createRequest: createRequest
            };

            console.log('📄 Saving public data...');
            fs.writeFileSync(didPublicFile, JSON.stringify(publicData, null, 2));
            console.log(`✅ Public data: ${didPublicFile}`);

            return {
                didDataFile,
                didKeysFile,
                didPublicFile,
                didData
            };

        } catch (error) {
            console.error(`${colors.red}❌ Failed to save DID data:${colors.reset}`);
            console.error('Error details:', error.message);
            this.errors.saveData = error.message;
            throw error;
        }
    }

    async updateEnvFile() {
        try {
            console.log(`\n${colors.cyan}${colors.bright}📝 STEP 7: Updating Environment File${colors.reset}`);
            console.log('═'.repeat(60));

            console.log('📖 Reading current .env file...');
            let envContent = '';
            
            if (fs.existsSync('.env')) {
                envContent = fs.readFileSync('.env', 'utf8');
                console.log('✅ .env file found and read');
            } else {
                console.log('⚠️ .env file not found, will create new one');
            }

            const didIdentifier = this.shortFormDid.split(':').pop();

            const updates = {
                'DID_LONG_FORM': this.longFormDid,
                'DID_SHORT_FORM': this.shortFormDid,
                'DID_IDENTIFIER': didIdentifier,
                'DID_CREATED_AT': new Date().toISOString(),
                'DID_AUTH_KEY_ID': this.didKeys.authentication.id
            };

            console.log('📝 Updates to apply:', Object.keys(updates));

            // Update env content
            for (const [key, value] of Object.entries(updates)) {
                const regex = new RegExp(`^${key}=.*$`, 'm');
                if (regex.test(envContent)) {
                    envContent = envContent.replace(regex, `${key}=${value}`);
                    console.log(`✅ Updated existing ${key}`);
                } else {
                    envContent += `\n${key}=${value}`;
                    console.log(`✅ Added new ${key}`);
                }
            }

            console.log('💾 Writing updated .env file...');
            fs.writeFileSync('.env', envContent);

            console.log(`${colors.green}✅ Environment file updated${colors.reset}`);
            Object.entries(updates).forEach(([key, value]) => {
                const displayValue = key.includes('LONG_FORM') ? `${value.substring(0, 50)}...` : value;
                console.log(`${colors.blue}📝 ${key}: ${displayValue}${colors.reset}`);
            });

        } catch (error) {
            console.error(`${colors.red}❌ Failed to update .env:${colors.reset}`, error.message);
            this.errors.envUpdate = error.message;
        }
    }

    generateSummary() {
        console.log(`\n${colors.cyan}${colors.bright}📊 FINAL SUMMARY${colors.reset}`);
        console.log('═'.repeat(60));

        const errorCount = Object.keys(this.errors).length;
        const success = errorCount === 0 && this.longFormDid;

        console.log(`${colors.green}✅ DID Creation: ${success ? 'SUCCESS' : 'FAILED'}${colors.reset}`);
        console.log(`${colors.red}❌ Errors: ${errorCount}${colors.reset}`);

        if (success) {
            console.log(`\n${colors.yellow}🆔 CREATED DID IDENTITY:${colors.reset}`);
            console.log(`  Investor ID: ${this.investorId}`);
            console.log(`  Short DID: ${this.shortFormDid}`);
            console.log(`  Long DID: ${this.longFormDid.substring(0, 80)}...`);
            console.log(`  Auth Key: ${this.didKeys.authentication.id}`);
            console.log('');
            console.log(`${colors.yellow}💼 LINKED WALLETS:${colors.reset}`);
            console.log(`  Bitcoin: ${this.btcAddress}`);
            console.log(`  Ethereum: ${this.ethAddress}`);
            console.log(`  Solana: ${this.solAddress}`);
        }

        if (errorCount > 0) {
            console.log(`${colors.red}❌ ERRORS:${colors.reset}`);
            Object.entries(this.errors).forEach(([key, error]) => {
                console.log(`  ${key}: ${error}`);
            });
        }

        return {
            success,
            investorId: this.investorId,
            did: this.longFormDid,
            shortForm: this.shortFormDid,
            errorCount,
            errors: this.errors,
            wallets: {
                bitcoin: this.btcAddress,
                ethereum: this.ethAddress,
                solana: this.solAddress
            }
        };
    }

    async run() {
        console.log(`${colors.bright}${colors.cyan}🆔 DID:ION IDENTITY CREATION${colors.reset}`);
        console.log(`${colors.cyan}⏰ Started: ${new Date().toISOString()}${colors.reset}`);
        console.log(`${colors.cyan}👤 Investor: ${this.investorId}${colors.reset}`);
        console.log('═'.repeat(80));

        try {
            console.log('🚀 Starting DID creation process...');

            this.validateWalletAddresses();
            await this.generateDIDKeys();
            await this.createDIDInstance();
            await this.generateLongFormDID();
            await this.saveDIDData();
            await this.updateEnvFile();

            const summary = this.generateSummary();

            console.log(`\n${colors.green}${colors.bright}🎉 DID CREATION COMPLETED!${colors.reset}`);
            console.log(`\n${colors.yellow}🚀 NEXT STEPS:${colors.reset}`);
            console.log('  1. ✅ DID identity created successfully');
            console.log('  2. 🔗 Create wallet binding proofs');
            console.log('  3. 📝 Run: npm run create-proofs');
            console.log('  4. 📝 Or: node scripts/3-create-proofs.js');

            return summary;

        } catch (error) {
            console.error(`\n${colors.red}${colors.bright}💥 DID CREATION FAILED:${colors.reset}`);
            console.error('Main error:', error.message);
            console.error('Stack trace:', error.stack);

            const summary = this.generateSummary();
            summary.success = false;
            summary.mainError = error.message;
            return summary;
        }
    }
}

// Main execution
async function main() {
    console.log('🎬 Starting DID creation...');

    try {
        const creator = new DIDCreator();
        console.log('🏃 Running DID creator...');
        const result = await creator.run();

        console.log('📊 Final result:', JSON.stringify(result, null, 2));
        process.exit(result.success ? 0 : 1);
    } catch (error) {
        console.error('💥 Unhandled error in main:', error);
        process.exit(1);
    }
}

// Run if called directly
const isMainModule = process.argv[1] && process.argv[1].endsWith('2-create-did.js');

if (isMainModule) {
    console.log('🎯 Script is being run directly');
    main().catch((error) => {
        console.error('🔥 Fatal error:', error);
        process.exit(1);
    });
} else {
    console.log('📦 Script is being imported as module');
}

export { DIDCreator };