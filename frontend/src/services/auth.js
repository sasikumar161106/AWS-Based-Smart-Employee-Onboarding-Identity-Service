const REGION = import.meta.env.VITE_AWS_REGION || "ap-south-1";
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || "";

/**
 * Safely decodes a JWT token payload
 */
export function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to parse JWT", e);
    return null;
  }
}

/**
 * Sign in user using Amazon Cognito InitiateAuth API
 */
export async function signInCognito(email, password, userClientId = CLIENT_ID) {
  const targetClientId = userClientId || CLIENT_ID;

  if (!targetClientId) {
    throw new Error(
      "Cognito App Client ID is missing. Please enter your App Client ID or set VITE_COGNITO_CLIENT_ID."
    );
  }

  const endpoint = `https://cognito-idp.${REGION}.amazonaws.com/`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
    },
    body: JSON.stringify({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: targetClientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage =
      data.message || data.__type?.split("#")[1] || "Authentication failed";
    throw new Error(errorMessage);
  }

  if (data.ChallengeName === "NEW_PASSWORD_REQUIRED") {
    return {
      challenge: "NEW_PASSWORD_REQUIRED",
      session: data.Session,
      username: email,
    };
  }

  const authResult = data.AuthenticationResult;
  if (authResult) {
    const idToken = authResult.IdToken;
    const decoded = parseJwt(idToken);

    const groups = decoded?.["cognito:groups"] || [];
    const userRole = groups.includes("HRAdmins")
      ? "HRAdmin"
      : groups.includes("Employees")
      ? "Employee"
      : "Employee";

    const userProfile = {
      email: decoded?.email || email,
      name: decoded?.name || email.split("@")[0],
      employeeId: decoded?.["custom:employee_id"] || decoded?.sub,
      role: userRole,
      groups: groups,
      sub: decoded?.sub,
    };

    localStorage.setItem("cognito_token", idToken);
    localStorage.setItem("cognito_access_token", authResult.AccessToken);
    localStorage.setItem("cognito_user", JSON.stringify(userProfile));

    if (userProfile.employeeId) {
      localStorage.setItem("employee_id", userProfile.employeeId);
    }

    return {
      success: true,
      user: userProfile,
      tokens: authResult,
    };
  }

  throw new Error("Unexpected auth response structure");
}

/**
 * Log out current Cognito session
 */
export function signOutCognito() {
  localStorage.removeItem("cognito_token");
  localStorage.removeItem("cognito_access_token");
  localStorage.removeItem("cognito_user");
}

/**
 * Get current logged in user from localStorage
 */
export function getCurrentAuthUser() {
  try {
    const userStr = localStorage.getItem("cognito_user");
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
}
