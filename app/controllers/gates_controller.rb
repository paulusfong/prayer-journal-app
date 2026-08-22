class GatesController < ApplicationController
  allow_without_membership

  def pending
    redirect_to root_path if Current.user.memberships.approved.any?
  end

  def need_invite
    if Current.user.memberships.approved.any?
      redirect_to root_path
    elsif Current.user.memberships.pending.any?
      redirect_to pending_path
    end
  end
end
