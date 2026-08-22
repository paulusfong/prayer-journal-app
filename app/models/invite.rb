class Invite < ApplicationRecord
  belongs_to :circle
  belongs_to :created_by, class_name: "User"

  scope :active, -> { where(revoked_at: nil).where("expires_at > ?", Time.current) }

  def self.digest(raw)
    OpenSSL::Digest::SHA256.hexdigest(raw)
  end

  def self.issue!(circle, created_by:)
    circle.invites.active.find_each(&:revoke!)
    raw = SecureRandom.urlsafe_base64(32)
    create!(
      circle: circle,
      created_by: created_by,
      token: raw,
      token_digest: digest(raw),
      expires_at: 30.days.from_now
    )
  end

  def self.find_active_by_token(raw)
    return if raw.blank?

    active.find_by(token_digest: digest(raw)) || active.find_by(token: raw)
  end

  def active?
    revoked_at.nil? && expires_at.future?
  end

  def revoke!
    update!(revoked_at: Time.current)
  end
end
