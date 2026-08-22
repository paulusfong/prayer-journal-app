class MagicLinkMailer < ApplicationMailer
  def signin
    @user = params[:user]
    @raw_token = params[:raw_token]
    @url = magic_signin_url(@raw_token)
    mail to: @user.email_address, subject: "Sign in to Prayer Journal"
  end
end
