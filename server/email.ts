import { createTransport, type Transporter } from 'nodemailer';

/**
 * Sending email.
 *
 * Two jobs only, both optional to the visitor and both tied to an address they
 * chose to give:
 *
 *   1. "your answer is ready"
 *   2. delivering a recovered magic link to the inbox it belongs to
 *
 * ---------------------------------------------------------------------------
 * WHY THE LINK GOES TO THE INBOX RATHER THAN THE SCREEN
 * ---------------------------------------------------------------------------
 * When a visitor gave an email, recovery sends the link there instead of
 * returning it in the response. That is not ceremony: returning it would hand
 * the link to whoever made the request, and whoever made the request is not
 * necessarily the person who wrote the submission. Sending it to the address
 * already on file means only the actual owner receives it.
 *
 * The date-window route has no such channel, so it does return the link — the
 * secret word plus the date is the authentication there. Both routes answer
 * identically when nothing matches.
 *
 * ---------------------------------------------------------------------------
 * NO SMTP CONFIGURED IS A SUPPORTED STATE
 * ---------------------------------------------------------------------------
 * Without SMTP settings the mailer logs what it *would* have sent and reports
 * success. The whole flow therefore works in development with nothing set up,
 * and a missing configuration never breaks a submission — an unsent reminder
 * is a small loss, a failed submission is not.
 */

export type Mail = {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
};

export interface Mailer {
  readonly id: string;
  send(mail: Mail): Promise<{ ok: boolean; reason?: string }>;
}

/** Development and un-configured production: log, never send. */
export class ConsoleMailer implements Mailer {
  readonly id = 'console';

  async send(mail: Mail): Promise<{ ok: boolean }> {
    console.log(
      `\n[email] not sent — no SMTP configured\n` +
        `  to:      ${mail.to}\n` +
        `  subject: ${mail.subject}\n` +
        `  ${mail.text.split('\n').join('\n  ')}\n`,
    );
    return { ok: true };
  }
}

export class SmtpMailer implements Mailer {
  readonly id = 'smtp';
  private readonly transport: Transporter;

  constructor(
    url: string,
    private readonly from: string,
  ) {
    this.transport = createTransport(url);
  }

  async send(mail: Mail): Promise<{ ok: boolean; reason?: string }> {
    try {
      await this.transport.sendMail({
        from: this.from,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
      });
      return { ok: true };
    } catch (error) {
      // Never throw at the call site. A failed email must not fail the action
      // that triggered it — the reply is still written, the link still exists.
      console.error('[email] send failed:', error);
      return { ok: false, reason: 'send-failed' };
    }
  }
}

export function createMailer(env: NodeJS.ProcessEnv): Mailer {
  const url = env.SMTP_URL;
  const from = env.MAIL_FROM;
  if (!url || !from) return new ConsoleMailer();
  return new SmtpMailer(url, from);
}

/* ------------------------------------------------------------- the messages */

const SIGN_OFF = 'Advice for a Dollar';

/**
 * Deliberately plain, and deliberately vague about content.
 *
 * An email sits in an inbox that other people may see. It says a reply is
 * waiting; it never quotes what was written or what was answered. Someone
 * whose situation is the reason they wrote anonymously should not be exposed
 * by a notification.
 */
export function answerReadyEmail(link: string): Omit<Mail, 'to'> {
  return {
    subject: 'Your reply is ready',
    text: [
      'Your reply is waiting for you.',
      '',
      link,
      '',
      'This link is private. Anyone who has it can read your submission, so',
      'please keep it to yourself.',
      '',
      SIGN_OFF,
    ].join('\n'),
  };
}

export function recoveredLinkEmail(link: string): Omit<Mail, 'to'> {
  return {
    subject: 'Your link',
    text: [
      'Someone asked to recover a submission using this email address and a',
      'secret word. If that was you, here is your link:',
      '',
      link,
      '',
      'If it was not you, nothing has happened and you can ignore this. The',
      'link only works for the submission it belongs to.',
      '',
      SIGN_OFF,
    ].join('\n'),
  };
}
