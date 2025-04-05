import ThirdPartyNode from "supertokens-node/recipe/thirdparty/index.js";
import SessionNode from "supertokens-node/recipe/session/index.js";
import Dashboard from "supertokens-node/recipe/dashboard/index.js";
import UserRoles from "supertokens-node/recipe/userroles/index.js";
import { useAppInfo } from "~/config/appInfo";
import { type TypeInput } from "supertokens-node/types";
import SuperTokens from "supertokens-node";

export let backendConfig = (): TypeInput => {
    const appInfo = useAppInfo();
    return {
        supertokens: {
            // this is the location of the SuperTokens core.
            connectionURI: process.env.SUPERTOKENS_CONNECTION_URI || "",
        },
        appInfo,
        // recipeList contains all the modules that you want to
        // use from SuperTokens. See the full list here: https://supertokens.com/docs/guides
        recipeList: [
            ThirdPartyNode.init({
                signInAndUpFeature: {
                    providers: [
                        // We have provided you with development keys which you can use for testing.
                        // IMPORTANT: Please replace them with your own OAuth keys for production use.
                        {
                            config: {
                                thirdPartyId: "google",
                                clients: [
                                    {
                                        clientId: process.env.GOOGLE_CLIENT_ID || "",
                                        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
                                    },
                                ],
                            },
                        },
                        {
                            config: {
                                thirdPartyId: "github",
                                clients: [
                                    {
                                        clientId: process.env.GITHUB_CLIENT_ID || "",
                                        clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
                                    },
                                ],
                            },
                        },
                    ],
                },
            }),
            SessionNode.init(),
            Dashboard.init(),
            UserRoles.init(),
        ],
        framework: "custom",
    };
};

let initialized = false;
export function ensureSuperTokensInit() {
    if (!initialized) {
        SuperTokens.init(backendConfig());
        initialized = true;
    }
}
