class PrayerRequest < ApplicationRecord
  CATEGORIES = {
    "health" => "Health",
    "family" => "Family",
    "work_school" => "Work/School",
    "church_ministry" => "Church/Ministry",
    "friends" => "Friends",
    "other" => "Other"
  }.freeze

  belongs_to :circle
  belongs_to :author, class_name: "User"
  belongs_to :answered_by, class_name: "User", optional: true
  has_many :request_updates, dependent: :destroy
  has_many :prayer_notes, dependent: :destroy
  has_many :prayer_marks, dependent: :destroy
  has_many :request_grants, dependent: :destroy
  has_many :praying_users, through: :prayer_marks, source: :user

  enum :visibility, { private: "private", circle: "circle" }, prefix: true, default: :circle
  enum :status, { open: "open", answered: "answered" }, prefix: true, default: :open

  validates :title, presence: true, length: { maximum: 120 }
  validates :body, length: { maximum: 2000 }, allow_blank: true
  validates :who_for, length: { maximum: 80 }, allow_blank: true
  validates :category, inclusion: { in: CATEGORIES.keys }, allow_blank: true
  validates :category_other, length: { maximum: 80 }, allow_blank: true

  scope :open_list, -> { status_open.order(Arel.sql("hope_by IS NULL, hope_by ASC"), created_at: :desc) }
  scope :answered_list, -> { status_answered.order(answered_at: :desc) }

  def self.visible_to(user)
    return none unless user && Current.circle

    approved = user.approved_member_of?(Current.circle)
    return none unless approved

    where(circle: Current.circle).where(
      "prayer_requests.author_id = :uid OR prayer_requests.visibility = :circle OR EXISTS (
        SELECT 1 FROM request_grants WHERE request_grants.prayer_request_id = prayer_requests.id
          AND request_grants.user_id = :uid
      )",
      uid: user.id, circle: visibilities[:circle]
    )
  end

  def visible_to?(user)
    return false unless user&.approved_member_of?(circle)
    return true if author_id == user.id
    return true if visibility_circle?
    request_grants.exists?(user: user)
  end

  def category_label
    return if category.blank?
    return category_other.presence || CATEGORIES["other"] if category == "other"

    CATEGORIES[category]
  end

  def answer!(by:)
    return if status_answered?

    update!(status: :answered, answered_at: Time.current, answered_by: by)
  end

  def reopen!
    return unless status_answered?

    update!(status: :open, answered_at: nil, answered_by: nil)
  end

  def marked_by?(user)
    prayer_marks.exists?(user: user)
  end

  def notify_new_request
    return unless visibility_circle?

    circle.approved_users.where.not(id: author_id).find_each do |recipient|
      CircleMailer.with(prayer_request: self, recipient: recipient).new_request.deliver_later
    end
  end

  def notify_answered
    return if answered_by_id == author_id

    CircleMailer.with(prayer_request: self, recipient: author).request_answered.deliver_later
  end
end
