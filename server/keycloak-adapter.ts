import axios from "axios";

const KEYCLOAK_REALM_URL = process.env.OIDC_ISSUER || "";

export const requestPermission =
  (responseMode: string) =>
  async (accessToken: string, permission = "") => {
    const response = await axios.post(
      `${KEYCLOAK_REALM_URL}/protocol/openid-connect/token`,
      {
        // client_id: process.env.OIDC_CLIENT_ID,
        response_mode: responseMode,
        grant_type: "urn:ietf:params:oauth:grant-type:uma-ticket",
        audience: process.env.OIDC_CLIENT_ID,
        ...(permission && { permission }),
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response;
  };

export const checkDecision = requestPermission("decision");
export const listPermissions = requestPermission("permissions");
