// SMS delivery. Currently logs to the console; an SMS provider will be plugged in here
// without changes to callers.

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  console.log(`\n📱 Login code for ${phone}: ${code}\n`);
}

/** A short notice to a customer (a reply or a status change on their order). Never throws. */
export async function sendNoticeSms(phone: string, text: string): Promise<void> {
  try {
    console.log(`\n📱 SMS to ${phone}: ${text}\n`);
  } catch (e) {
    console.error("SMS failed:", e);
  }
}
