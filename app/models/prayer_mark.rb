class PrayerMark < ApplicationRecord
  belongs_to :prayer_request, counter_cache: true
  belongs_to :user

  validates :user_id, uniqueness: { scope: :prayer_request_id }
end
