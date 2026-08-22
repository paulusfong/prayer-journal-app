class MembershipsController < ApplicationController
  before_action :require_owner
  before_action :set_membership, only: %i[ update destroy ]

  def index
    @pending = current_circle.memberships.pending.includes(:user)
    @members = current_circle.memberships.approved.includes(:user)
    @invite = current_circle.active_invite
  end

  def update
    case params[:decision]
    when "approve"
      @membership.approve!
      redirect_to memberships_path, notice: "#{@membership.user.display_label} is in."
    when "decline"
      @membership.decline!
      redirect_to memberships_path, notice: "Declined."
    else
      redirect_to memberships_path, alert: "Unknown action."
    end
  end

  def destroy
    @membership.revoke!
    redirect_to memberships_path, notice: "#{@membership.user.display_label} was removed."
  rescue RuntimeError => e
    redirect_to memberships_path, alert: e.message
  end

  private
    def set_membership
      @membership = current_circle.memberships.find(params[:id])
    end
end
