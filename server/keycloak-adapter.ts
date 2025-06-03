import axios from "axios";

const KEYCLOAK_REALM_URL = process.env.OIDC_ISSUER || "";

export const requestPermission =
  (responseMode: string) =>
  async (accessToken: string, permission = "") => {
    try {
      // Prepare the data as URL-encoded parameters
      const params = new URLSearchParams();
      params.append("response_mode", responseMode);
      params.append(
        "grant_type",
        "urn:ietf:params:oauth:grant-type:uma-ticket"
      );
      params.append("audience", process.env.OIDC_CLIENT_ID || "");

      if (permission) {
        params.append("permission", permission);
      }

      const response = await fetch(
        `${KEYCLOAK_REALM_URL}/protocol/openid-connect/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${accessToken}`,
          },
          body: params.toString(),
        }
      );
      // const response = await axios.post(
      //   `${KEYCLOAK_REALM_URL}/protocol/openid-connect/token`,
      //   params.toString(),
      //   {
      //     headers: {
      //       "Content-Type": "application/x-www-form-urlencoded",
      //       Authorization: `Bearer ${accessToken}`,
      //     },
      //   }
      const data = await response.json();
      console.log("Permission response:", data);
      return data;
      // console.log("Permission response:", response.data);
      // return response;
    } catch (error) {
      console.error("Error in requestPermission:", error);
      // if (axios.isAxiosError(error)) {
      //   console.error("Axios error details:", {
      //     status: error.response?.status,
      //     statusText: error.response?.statusText,
      //     data: error.response?.data,
      //   });
      // }
      throw error;
    }
  };

export const checkDecision = requestPermission("decision");
export const listPermissions = requestPermission("permissions");
