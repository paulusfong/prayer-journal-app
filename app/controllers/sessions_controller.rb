class SessionsController < ApplicationController
  allow_unauthenticated_access only: %i[ new create ]
  allow_without_membership
  rate_limit to: 5, within: 3.minutes, only: :create, with: -> { redirect_to new_session_path, alert: "Try again later." }

  def new
  end

  def create
    email = params.expect(:email_address)
    user = find_or_prepare_user(email)
    if user
      raw = user.issue_magic_link
      MagicLinkMailer.with(user: user, raw_token: raw).signin.deliver_later
    end

    redirect_to new_session_path, notice: "Check your email for a sign-in link."
  end

  def destroy
    terminate_session
    redirect_to new_session_path, status: :see_other
  end

  private
    def find_or_prepare_user(email)
      existing = User.find_by(email_address: email)
      return existing if existing
      return User.create!(email_address: email) if Circle.none?
      return User.create!(email_address: email) if Invite.find_active_by_token(session[:invite_token])
    end
end
