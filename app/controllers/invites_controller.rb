class InvitesController < ApplicationController
  before_action :require_owner

  def create
    invite = Invite.issue!(current_circle, created_by: Current.user)
    flash[:invite_url] = join_url(invite.token)
    redirect_to memberships_path, notice: "New invite link ready."
  end
end
