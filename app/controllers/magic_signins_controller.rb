class MagicSigninsController < ApplicationController
  allow_unauthenticated_access
  allow_without_membership
  rate_limit to: 5, within: 3.minutes, only: :create, with: -> { redirect_to new_session_path, alert: "Try again later." }

  def show
    @link = MagicLink.find_valid(params[:token])
    unless @link
      redirect_to new_session_path, alert: "That sign-in link is invalid or expired. Request a new one."
    end
  end

  def create
    user = MagicLink.consume(params[:token])
    unless user
      redirect_to new_session_path, alert: "That sign-in link is invalid or expired. Request a new one."
      return
    end

    start_new_session_for user
    bootstrap_or_join(user)
    maybe_prompt_display_name(user)

    redirect_to after_sign_in_url(user)
  end

  private
    def bootstrap_or_join(user)
      if Circle.none?
        Circle.create!(name: "Our circle").bootstrap!(user)
        return
      end

      redeem_invite(user, session.delete(:invite_token))
    end

    def redeem_invite(user, raw_token)
      invite = Invite.find_active_by_token(raw_token)
      return unless invite

      membership = user.memberships.find_or_initialize_by(circle: invite.circle)
      if membership.approved?
        membership
      elsif membership.persisted?
        membership.re_request! unless membership.pending?
      else
        membership.status = :pending
        membership.role = :member
        membership.save!
      end
    end

    def maybe_prompt_display_name(user)
      session[:prompt_display_name] = user.display_name.blank?
    end

    def after_sign_in_url(user)
      return edit_profile_path if session[:prompt_display_name]
      return root_url if user.memberships.approved.any?
      return pending_path if user.memberships.pending.any?

      need_invite_path
    end
end
