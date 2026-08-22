class Circle < ApplicationRecord
  has_many :memberships, dependent: :destroy
  has_many :users, through: :memberships
  has_many :invites, dependent: :destroy
  has_many :prayer_requests, dependent: :destroy

  validates :name, presence: true

  def approved_users
    users.merge(Membership.approved)
  end

  def approved_memberships
    memberships.approved
  end

  def pending_memberships
    memberships.pending
  end

  def active_invite
    invites.active.order(created_at: :desc).first
  end

  def bootstrap!(owner)
    transaction do
      memberships.create!(user: owner, role: :owner, status: :approved)
      Invite.issue!(self, created_by: owner)
    end
  end
end
