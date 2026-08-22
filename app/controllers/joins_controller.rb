class JoinsController < ApplicationController
  allow_unauthenticated_access
  allow_without_membership

  def show
    @invite = Invite.find_active_by_token(params[:token])
    unless @invite
      render :expired, status: :not_found
      return
    end

    unless authenticated?
      session[:invite_token] = params[:token]
      redirect_to new_session_path, notice: "Enter your email to join this circle."
      return
    end

    redeem
  end

  private
    def redeem
      membership = Current.user.memberships.find_or_initialize_by(circle: @invite.circle)
      if membership.approved?
        redirect_to root_path, notice: "You are already in this circle."
      elsif membership.persisted? && membership.pending?
        redirect_to pending_path, notice: "Your request is waiting for approval."
      else
        if membership.persisted?
          membership.re_request!
        else
          membership.assign_attributes(status: :pending, role: :member)
          membership.save!
        end
        redirect_to pending_path, notice: "Asked to join. The owner will approve you."
      end
    end
end
