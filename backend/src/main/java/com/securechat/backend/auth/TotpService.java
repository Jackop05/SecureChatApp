package com.securechat.backend.auth;

import com.eatthepath.otp.TimeBasedOneTimePasswordGenerator;
import org.apache.commons.codec.binary.Base32;
import org.springframework.stereotype.Service;

import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;

@Service
public class TotpService {

    private final TimeBasedOneTimePasswordGenerator totp;
    private final Base32 base32;

    public TotpService() throws NoSuchAlgorithmException {
        this.totp = new TimeBasedOneTimePasswordGenerator();
        this.base32 = new Base32();
    }

    public String generateSecret() {
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance(totp.getAlgorithm());
            keyGenerator.init(160);
            SecretKey key = keyGenerator.generateKey();
            return base32.encodeToString(key.getEncoded());
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error generating TOTP secret", e);
        }
    }

    public boolean verifyCode(String secretBase32, String code) {
        try {
            byte[] decodedKey = base32.decode(secretBase32);
            SecretKey key = new SecretKeySpec(decodedKey, totp.getAlgorithm());
            int userCode = Integer.parseInt(code);

            // Check current time, previous step (-30s), and next step (+30s) to account for drift
            Instant now = Instant.now();
            int codeNow = totp.generateOneTimePassword(key, now);
            int codePrev = totp.generateOneTimePassword(key, now.minusSeconds(30));
            int codeNext = totp.generateOneTimePassword(key, now.plusSeconds(30));

            System.out.println("Verifying TOTP. User: " + userCode + ", Expected: " + codeNow + " or " + codePrev + " or " + codeNext);

            if (codeNow == userCode) return true;
            if (codePrev == userCode) return true;
            if (codeNext == userCode) return true;

            return false;
        } catch (NumberFormatException | InvalidKeyException e) {
            System.out.println("TOTP Verification Error: " + e.getMessage());
            return false;
        }
    }

    public String generateQrCodeUri(String secretBase64, String username) {
        return String.format("otpauth://totp/SecureChat:%s?secret=%s&issuer=SecureChat", username, secretBase64);
    }
}
