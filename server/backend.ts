import ThirdPartyNode from "supertokens-node/recipe/thirdparty/index.js";
import SessionNode from "supertokens-node/recipe/session/index.js";
import Dashboard from "supertokens-node/recipe/dashboard/index.js";
import UserRoles from "supertokens-node/recipe/userroles/index.js";
import { appInfo } from "~/config/appInfo";
import { type TypeInput } from "supertokens-node/types";
import SuperTokens from "supertokens-node";

export let backendConfig = (): TypeInput => {
    return {
        supertokens: {
            // this is the location of the SuperTokens core.
            connectionURI: "https://try.supertokens.com",
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
                                        clientId:
                                            "1060725074195-kmeum4crr01uirfl2op9kd5acmi9jutn.apps.googleusercontent.com",
                                        clientSecret: "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",
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
        isInServerlessEnv: true,
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
