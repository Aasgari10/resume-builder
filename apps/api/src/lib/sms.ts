// SMS delivery. Currently logs to the console; an SMS provider will be plugged in here
// without changes to callers.

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  console.log(`\n📱 Login code for ${phone}: ${code}\n`);
}
