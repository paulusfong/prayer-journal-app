class RequestUpdate < ApplicationRecord
  belongs_to :prayer_request
  belongs_to :author, class_name: "User"

  validates :body, presence: true, length: { maximum: 2000 }

  scope :chronologically, -> { order(:created_at) }
end
