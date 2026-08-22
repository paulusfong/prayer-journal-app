class ProfilesController < ApplicationController
  allow_without_membership

  def edit
    @user = Current.user
  end

  def update
    @user = Current.user
    if @user.update(profile_params)
      session.delete(:prompt_display_name)
      redirect_to after_profile_url, notice: "Name saved."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def skip
    session.delete(:prompt_display_name)
    session[:skipped_profile] = true
    redirect_to after_profile_url
  end

  private
    def profile_params
      params.expect(user: [ :display_name ])
    end

    def after_profile_url
      return root_path if Current.user.memberships.approved.any?
      return pending_path if Current.user.memberships.pending.any?

      need_invite_path
    end
end
