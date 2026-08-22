class MagicLink < ApplicationRecord
  belongs_to :user

  def self.digest(raw)
    OpenSSL::Digest::SHA256.hexdigest(raw)
  end

  def self.issue!(user)
    raw = SecureRandom.urlsafe_base64(32)
    create!(user: user, token_digest: digest(raw), expires_at: 30.minutes.from_now)
    raw
  end

  def self.find_valid(raw)
    return if raw.blank?

    find_by(token_digest: digest(raw))&.then { |link| link if link.expires_at.future? }
  end

  def self.consume(raw)
    link = find_valid(raw)
    return unless link

    user = link.user
    link.destroy!
    user
  end
end
