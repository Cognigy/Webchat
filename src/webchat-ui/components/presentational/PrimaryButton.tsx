import React, { forwardRef } from "react";
import Button from "./Button";

const PrimaryButton = forwardRef<HTMLButtonElement, React.HTMLAttributes<HTMLButtonElement>>(
	(props, ref) => {
		return <Button {...props} ref={ref} color="primary" />;
	},
);

export default PrimaryButton;
