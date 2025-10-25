import { describe, it, expect } from 'vitest';
import { validateEmail } from '../../packages/frontend/src/lib/emailValidation.js';
import { validateUsername } from '../../packages/frontend/src/lib/usernameValidation.js';
import { validatePassword, getPasswordStrength } from '../../packages/frontend/src/lib/passwordValidation.js';
import { validatePhone } from '../../packages/frontend/src/lib/phoneValidation.js';
import { validateFullname } from '../../packages/frontend/src/lib/fullnameValidation.js';

describe('Unit: validators', () => {
  it('email: rejects empty and invalid, accepts valid', () => {
    const empty = validateEmail('');
    const invalid = validateEmail('not-an-email');
    const valid = validateEmail('user@example.com');
    expect(empty.isValid).toBe(false);
    expect(invalid.isValid).toBe(false);
    expect(valid.isValid).toBe(true);
    expect(valid.message).toBeNull();
  });

  it('username: length, charset and starts-with-letter rules', () => {
    const short = validateUsername('ab');
    const badStart = validateUsername('1abc');
    const badChars = validateUsername('ab c!');
    const ok = validateUsername('abc_123');
    expect(short.isValid).toBe(false);
    expect(badStart.isValid).toBe(false);
    expect(badChars.isValid).toBe(false);
    expect(ok.isValid).toBe(true);
  });

  it('password: conditions and strength mapping', () => {
    const weak = validatePassword('a');
    const fair = validatePassword('abcdefghij'); // letters only, min length
    const good = validatePassword('abcd123456'); // letters + digits, min length
    const strong = validatePassword('Abcd#12345'); // letters + special + digits + length
    expect(weak.isValid).toBe(false);
    expect(getPasswordStrength('a')).toBeTypeOf('string');
    expect(fair.isValid).toBe(false);
    expect(good.isValid).toBe(true);
    expect(strong.isValid).toBe(true);
  });

  it('phone: VN formats domestic and international', () => {
    const invalid = validatePhone('12345');
    const domestic = validatePhone('0912345678');
    const intl = validatePhone('+84912345678');
    expect(invalid.isValid).toBe(false);
    expect(domestic.isValid).toBe(true);
    expect(intl.isValid).toBe(true);
    expect(domestic.message).toBeNull();
  });

  it('fullname: rejects empty, rules for charset/length/spaces', () => {
    const empty = validateFullname('');
    const badChars = validateFullname('John_Doe');
    const manySpaces = validateFullname('John  Doe');
    const ok = validateFullname('Nguyễn Văn A');
    expect(empty.isValid).toBe(false);
    expect(badChars.isValid).toBe(false);
    expect(manySpaces.isValid).toBe(false);
    expect(ok.isValid).toBe(true);
  });
});

