import { ApiProperty } from '@nestjs/swagger';

export class LoginAdapterDto {
    @ApiProperty({
        description: 'Login adapter identifier/key',
        example: 'xamvn-clone',
    })
    key: string;

    @ApiProperty({
        description: 'Display name of the login adapter',
        example: 'XamVN Clone (Standard XenForo)',
    })
    name: string;

    @ApiProperty({
        description: 'Description of the login adapter',
        example: 'Works with standard XenForo installations',
    })
    description: string;
}

export class LoginAdaptersResponseDto {
    @ApiProperty({
        description: 'List of available login adapters',
        type: [LoginAdapterDto],
    })
    adapters: LoginAdapterDto[];
}
