class RequestGrant < ApplicationRecord
  belongs_to :prayer_request
  belongs_to :user

  validates :user_id, uniqueness: { scope: :prayer_request_id }
end
