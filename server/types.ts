export interface UserProfile {
  id?: string;
  displayName?: string;
  username?: string;
  name?: {
    familyName?: string;
    givenName?: string;
    middleName?: string;
  };
  emails?: Array<{ value: string; type?: string }>;
  photos?: Array<{ value: string }>;
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  [key: string]: any; // For other potential properties
}
