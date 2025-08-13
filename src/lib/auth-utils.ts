import bcrypt from 'bcryptjs'

// パスワードをハッシュ化
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

// パスワードを検証
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

// パスワードの強度をチェック
export function validatePassword(password: string): { isValid: boolean; message: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'パスワードは8文字以上である必要があります' }
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'パスワードには大文字が含まれる必要があります' }
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'パスワードには小文字が含まれる必要があります' }
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'パスワードには数字が含まれる必要があります' }
  }
  
  return { isValid: true, message: 'パスワードの強度は十分です' }
} 
