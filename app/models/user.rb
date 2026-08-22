class User < ApplicationRecord
  has_secure_password validations: false
  has_many :sessions, dependent: :destroy
  has_many :memberships, dependent: :destroy
  has_many :circles, through: :memberships
  has_many :magic_links, dependent: :destroy
  has_many :authored_requests, class_name: "PrayerRequest", foreign_key: :author_id, dependent: :destroy
  has_many :prayer_marks, dependent: :destroy
  has_many :prayer_notes, foreign_key: :author_id, dependent: :destroy
  has_many :request_updates, foreign_key: :author_id, dependent: :destroy

  normalizes :email_address, with: ->(e) { e.strip.downcase }

  validates :email_address, presence: true, uniqueness: true

  def display_label
    display_name.presence || email_address.split("@").first
  end

  def approved_member_of?(circle)
    memberships.approved.exists?(circle: circle)
  end

  def owner_of?(circle)
    memberships.approved.owner.exists?(circle: circle)
  end

  def accessible_requests
    PrayerRequest.visible_to(self)
  end

  def issue_magic_link
    magic_links.where("expires_at > ?", Time.current).delete_all
    MagicLink.issue!(self)
  end
end
