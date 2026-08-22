class Membership < ApplicationRecord
  belongs_to :user
  belongs_to :circle

  enum :role, { member: "member", owner: "owner" }, default: :member
  enum :status, { pending: "pending", approved: "approved", revoked: "revoked" }, default: :pending

  validates :user_id, uniqueness: { scope: :circle_id }

  def approve!
    update!(status: :approved)
  end

  def decline!
    destroy!
  end

  def revoke!
    raise "Cannot revoke the last owner" if owner? && circle.memberships.approved.owner.where.not(id: id).none?

    update!(status: :revoked)
  end

  def re_request!
    update!(status: :pending, role: :member)
  end
end
