export default function generateRandomPassword(length: number): string {
  // removed certain characters to avoid confusion due to font
  const characters = "abcdefghkmnpqrstuvwxyzABCDEFGHKMNPRSTUVWXYZ123456789";
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters[randomIndex];
  }

  return password;
}
