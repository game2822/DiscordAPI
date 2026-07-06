import { GetFingerprint, LoginWithout2FA } from "../routes/Auth";
import { DiscordAPI } from "../structures/DiscordAPI";

export async function Login(email: string, password: string): Promise<DiscordAPI> {
  const fingerprint = await GetFingerprint();
  const loginResponse = await LoginWithout2FA(
    email,
    password,
    fingerprint.fingerprint,
    fingerprint.cookies
  );
  
  // Create and return a DiscordAPI instance with the token and user ID
  return new DiscordAPI(loginResponse.token, loginResponse.user_id);
}